/**
 * Admin Routes
 * Protected endpoints for ops management - daily summary generation and export retry.
 */

const DailySummary = require('../models/DailySummary');
const SystemSetting = require('../models/SystemSetting');
const { generateDailySummary, getJakartaDateKey } = require('../utils/dailySummary');

// Lazy load sheetsExport to avoid startup errors if credentials not configured
let sheetsExport = null;
const getSheetsExport = () => {
    if (!sheetsExport) {
        try {
            sheetsExport = require('../utils/sheetsExport');
        } catch (e) {
            console.warn('Google Sheets export not configured:', e.message);
        }
    }
    return sheetsExport;
};

const adminRoutes = async (fastify, options) => {

    // Middleware to check admin token
    const checkAdminToken = async (request, reply) => {
        const token = request.headers['x-admin-token'] || request.query.admin_token;
        const expectedToken = process.env.ADMIN_TOKEN;

        if (!expectedToken) {
            return reply.code(500).send({ error: 'ADMIN_TOKEN not configured' });
        }

        if (token !== expectedToken) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
    };

    // POST /admin/run-daily-summary - Trigger daily summary generation
    fastify.post('/admin/run-daily-summary', {
        preHandler: checkAdminToken
    }, async (request, reply) => {
        try {
            const { dateKey } = request.body || {};
            const targetDate = dateKey || getJakartaDateKey();

            console.log(`[Admin] Running daily summary for ${targetDate}`);

            const summary = await generateDailySummary(targetDate);

            // Attempt Google Sheets export
            const sheets = getSheetsExport();
            if (sheets && sheets.exportSummaryToSheets) {
                try {
                    await sheets.exportSummaryToSheets(summary);
                    // Update export status
                    await DailySummary.updateOne(
                        { _id: summary._id },
                        {
                            'export.google_sheets.status': 'success',
                            'export.google_sheets.last_attempt_at': new Date()
                        }
                    );
                } catch (exportError) {
                    console.error('[Admin] Google Sheets export failed:', exportError.message);
                    await DailySummary.updateOne(
                        { _id: summary._id },
                        {
                            'export.google_sheets.status': 'failed',
                            'export.google_sheets.last_error': exportError.message,
                            'export.google_sheets.last_attempt_at': new Date()
                        }
                    );
                }
            }

            return {
                success: true,
                message: `Summary generated for ${targetDate}`,
                summary: {
                    dateKey: summary.dateKey,
                    day_index: summary.day_index,
                    total_posts: summary.totals.total_posts,
                    export_status: summary.export.google_sheets.status
                }
            };
        } catch (error) {
            console.error('[Admin] Daily summary error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // POST /admin/retry-export/:dateKey - Retry Google Sheets export
    fastify.post('/admin/retry-export/:dateKey', {
        preHandler: checkAdminToken
    }, async (request, reply) => {
        try {
            const { dateKey } = request.params;

            const summary = await DailySummary.findOne({ dateKey });
            if (!summary) {
                return reply.code(404).send({ error: `No summary found for ${dateKey}` });
            }

            const sheets = getSheetsExport();
            if (!sheets || !sheets.exportSummaryToSheets) {
                return reply.code(500).send({ error: 'Google Sheets export not configured' });
            }

            try {
                await sheets.exportSummaryToSheets(summary);
                await DailySummary.updateOne(
                    { _id: summary._id },
                    {
                        'export.google_sheets.status': 'success',
                        'export.google_sheets.last_error': null,
                        'export.google_sheets.last_attempt_at': new Date()
                    }
                );
                return { success: true, message: `Export successful for ${dateKey}` };
            } catch (exportError) {
                await DailySummary.updateOne(
                    { _id: summary._id },
                    {
                        'export.google_sheets.status': 'failed',
                        'export.google_sheets.last_error': exportError.message,
                        'export.google_sheets.last_attempt_at': new Date()
                    }
                );
                return reply.code(500).send({
                    error: 'Export failed',
                    details: exportError.message
                });
            }
        } catch (error) {
            console.error('[Admin] Retry export error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // GET /admin/summaries - List recent summaries
    fastify.get('/admin/summaries', {
        preHandler: checkAdminToken
    }, async (request, reply) => {
        try {
            const limit = parseInt(request.query.limit) || 14;
            const summaries = await DailySummary.find()
                .sort({ day_index: -1 })
                .limit(limit);

            return { success: true, summaries };
        } catch (error) {
            console.error('[Admin] List summaries error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // GET /admin/summary/:dateKey - Get specific summary details
    fastify.get('/admin/summary/:dateKey', {
        preHandler: checkAdminToken
    }, async (request, reply) => {
        try {
            const { dateKey } = request.params;
            const summary = await DailySummary.findOne({ dateKey });

            if (!summary) {
                return reply.code(404).send({ error: `No summary found for ${dateKey}` });
            }

            return { success: true, summary };
        } catch (error) {
            console.error('[Admin] Get summary error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // GET /admin/live-stats - All-time + recent stats from DB
    fastify.get('/admin/live-stats', {
        preHandler: checkAdminToken
    }, async (request, reply) => {
        try {
            const Post = require('../models/Post');
            const Comment = require('../models/Comment');
            const Report = require('../models/Report');

            const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const [
                totalPostsAllTime,
                totalPosts7d,
                totalComments7d,
                reactionsAgg,
                reportedPosts7d,
                autoHidden,
                postsWithReplies,
                silentPosts
            ] = await Promise.all([
                Post.countDocuments({ status: 'active' }),
                Post.countDocuments({ created_at: { $gte: since7d }, status: 'active' }),
                Comment.countDocuments({ created_at: { $gte: since7d } }),
                Post.aggregate([
                    { $match: {} },
                    { $group: { _id: null, total: { $sum: '$likes' } } }
                ]),
                Report.countDocuments({ created_at: { $gte: since7d } }),
                Post.countDocuments({ status: 'hidden' }),
                Post.countDocuments({ comments_count: { $gt: 0 } }),
                Post.countDocuments({ likes: 0, comments_count: 0, status: 'active' })
            ]);

            return {
                success: true,
                stats: {
                    total_posts: totalPostsAllTime,
                    total_posts_7d: totalPosts7d,
                    total_comments: totalComments7d,
                    total_reactions: reactionsAgg[0]?.total || 0,
                    reported_posts_count: reportedPosts7d,
                    auto_hidden_count: autoHidden,
                    posts_with_replies: postsWithReplies,
                    posts_with_zero_interaction: silentPosts
                }
            };
        } catch (error) {
            console.error('[Admin] Live stats error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // GET /admin/settings - Retrieve all system settings
    fastify.get('/admin/settings', {
        preHandler: checkAdminToken
    }, async (request, reply) => {
        try {
            const settings = await SystemSetting.find();
            return { success: true, settings };
        } catch (error) {
            console.error('[Admin] Get settings error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // POST /admin/settings - Update or create a system setting
    fastify.post('/admin/settings', {
        preHandler: checkAdminToken
    }, async (request, reply) => {
        try {
            const { key, value } = request.body;
            if (!key) return reply.code(400).send({ error: 'Key is required' });

            const setting = await SystemSetting.findOneAndUpdate(
                { key },
                { value, updated_at: new Date() },
                { upsert: true, new: true }
            );

            return { success: true, setting };
        } catch (error) {
            console.error('[Admin] Update setting error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });
};

module.exports = adminRoutes;
