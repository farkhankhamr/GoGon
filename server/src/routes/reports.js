const Report = require('../models/Report');
const Post = require('../models/Post');
const IntelPost = require('../models/IntelPost');
const UserBan = require('../models/UserBan');

const reportRoutes = async (fastify, options) => {

    // POST /report - General Report Endpoint
    fastify.post('/report', async (request, reply) => {
        const { target_id, target_type, anon_id, reason } = request.body;
        // target_type: 'POST' or 'INTEL'

        if (!target_id || !target_type || !anon_id || !reason) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        let targetModel;
        let idField;

        if (target_type === 'POST') {
            targetModel = Post;
            idField = 'post_id';
        } else if (target_type === 'INTEL') {
            targetModel = IntelPost;
            idField = 'intel_id';
        } else {
            return reply.code(400).send({ error: 'Invalid target type' });
        }

        const target = await targetModel.findOne({ [idField]: target_id });
        if (!target) {
            // Already deleted or hidden
            return reply.code(404).send({ error: 'Content not found' });
        }

        // Prevent self-reporting? (Optional, but good practice)
        if (target.anon_id === anon_id) {
            return reply.code(400).send({ error: 'Cannot report own content' });
        }

        // Check deduplication (user reported this before?)
        const existingReport = await Report.findOne({
            target_id,
            reported_by: anon_id
        });

        if (existingReport) {
            return reply.code(200).send({ message: 'Already reported' });
        }

        // Create Report
        await Report.create({
            target_id,
            target_type,
            reported_by: anon_id,
            reported_user: target.anon_id,
            reason
        });

        // 1. Update User Ban Stats
        let userBan = await UserBan.findOne({ anon_id: target.anon_id });
        if (!userBan) {
            userBan = await UserBan.create({ anon_id: target.anon_id });
        }

        userBan.report_count += 1;
        userBan.warnings.push({ reason, timestamp: new Date(), target_type });

        if (userBan.report_count >= 5) {
            userBan.is_banned = true;
            userBan.banned_at = new Date();
        }
        await userBan.save();

        // 2. Moderation Action based on Type
        if (target_type === 'POST') {
            // Regular Post: Soft Delete (increment reportCount, hide if >= 3)
            const updatedPost = await Post.findOneAndUpdate(
                { _id: target._id },
                { $inc: { reportCount: 1 } },
                { new: true }
            );

            // Hide post if report threshold reached
            if (updatedPost.reportCount >= 3) {
                updatedPost.status = 'hidden';
                await updatedPost.save();
            }
        }
        else if (target_type === 'INTEL') {
            // Intel Post: Update metric + Hide if threshold met
            // Increment reports metric
            const updatedIntel = await IntelPost.findOneAndUpdate(
                { _id: target._id },
                { $inc: { "metrics.reports": 1 } },
                { new: true }
            );

            // Check threshold
            if (updatedIntel.metrics.reports >= 3) {
                updatedIntel.status = 'HIDDEN';
                await updatedIntel.save();
            }
        }

        return {
            success: true,
            message: 'Terima kasih. Kami akan cek konten ini agar GoGon tetap aman.'
        };
    });
};

module.exports = reportRoutes;
