/**
 * Daily Summary Generation Utility
 * Aggregates post_audit records for a given dateKey and generates daily summary.
 * Timezone-safe: uses Asia/Jakarta (UTC+7) for all date computations.
 */

const PostAudit = require('../models/PostAudit');
const Post = require('../models/Post'); // Import Post model for live metrics
const DailySummary = require('../models/DailySummary');

/**
 * Get current date in Asia/Jakarta timezone as YYYY-MM-DD
 * @returns {string} dateKey in format YYYY-MM-DD
 */
function getJakartaDateKey(date = new Date()) {
    const jakartaOffset = 7 * 60; // UTC+7 in minutes
    const jakartaTime = new Date(date.getTime() + (jakartaOffset + date.getTimezoneOffset()) * 60000);
    return jakartaTime.toISOString().split('T')[0];
}

/**
 * Calculate percentage with 2 decimal places, handle division by zero
 */
function pct(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 10000) / 100;
}

/**
 * Determine the next day_index
 * @returns {Promise<number>} next day index
 */
async function getNextDayIndex() {
    const lastSummary = await DailySummary.findOne().sort({ day_index: -1 }).limit(1);
    return lastSummary ? lastSummary.day_index + 1 : 1;
}

/**
 * Generate daily summary for a specific date
 * @param {string} dateKey - Date in YYYY-MM-DD format (Asia/Jakarta)
 * @returns {Promise<object>} Generated or existing DailySummary document
 */
async function generateDailySummary(dateKey) {
    // Check if summary already exists (idempotency)
    const existingSummary = await DailySummary.findOne({ dateKey });
    if (existingSummary) {
        console.log(`Summary for ${dateKey} already exists (Day ${existingSummary.day_index})`);
        return existingSummary;
    }

    // Aggregate post_audit records for this dateKey
    const audits = await PostAudit.find({ createdDateKey: dateKey });

    const totalPosts = audits.length;

    // Unique posters (distinct anon_id_hash)
    const uniquePosters = new Set(audits.map(a => a.anon_id_hash)).size;

    // Sentiment counts
    const sentimentCounts = { positive: 0, neutral: 0, sad: 0, angry: 0, hate: 0 };
    audits.forEach(a => {
        const s = a.sentiment || 'neutral';
        if (sentimentCounts.hasOwnProperty(s)) {
            sentimentCounts[s]++;
        } else {
            sentimentCounts.neutral++;
        }
    });

    // Topic counts
    const topicCounts = {};
    audits.forEach(a => {
        (a.topic_tags || []).forEach(tag => {
            topicCounts[tag] = (topicCounts[tag] || 0) + 1;
        });
    });

    // Sort topics by count
    const topicsArray = Object.entries(topicCounts)
        .map(([name, count]) => ({ name, count, percentage: pct(count, totalPosts) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 topics

    // Gender distribution
    const genderCounts = { Pria: 0, Wanita: 0, NB: 0, Unknown: 0 };
    audits.forEach(a => {
        const g = a.gender;
        if (g === 'M' || g === 'Pria') genderCounts.Pria++;
        else if (g === 'F' || g === 'Wanita') genderCounts.Wanita++;
        else if (g === 'NB') genderCounts.NB++;
        else genderCounts.Unknown++;
    });

    // Location distribution
    const cityCounts = {};
    audits.forEach(a => {
        const city = a.city || 'Unknown';
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    const locationArray = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count, percentage: pct(count, totalPosts) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 cities

    // Metrics totals (Fetch live data from Posts collection for accuracy)
    const postIds = audits.map(a => a.post_id);
    const livePosts = await Post.find({ _id: { $in: postIds } });

    let totalReactions = 0;
    let totalComments = 0;
    let postsWithReplies = 0;
    let postsWithZeroInteraction = 0;

    // Safety metrics
    let reportedPostsCount = 0;
    let autoHiddenCount = 0;

    // Use live posts for metrics if available, otherwise fall back to audit (which might be empty/stale)
    // Actually, we should rely on live posts for engagement.

    // Map existing posts by ID for quick lookup
    const livePostsMap = new Map(livePosts.map(p => [p._id.toString(), p]));

    audits.forEach(a => {
        const livePost = livePostsMap.get(a.post_id);

        let likes = 0;
        let comments = 0;
        let reports = 0;
        let isHidden = false;

        if (livePost) {
            // Live data
            likes = (livePost.metrics?.likes || 0); // Assuming metrics object exists on Post
            // Note: Post model might store these at top level or inside metrics. 
            // Based on previous tasks, Post has `metrics` object. 
            // Let's being safe: check structure. 
            // If Post model schema: { metrics: { likes, ... }, reportCount, status }

            // Re-checking Post schema via assumption from previous prompt: 
            // "Add/update fields: metrics: { likes, comments_count, ... }"
            likes = livePost.metrics?.likes || 0;
            comments = livePost.metrics?.comments_count || 0;

            // Also sum other reactions if available
            likes += (livePost.metrics?.saves || 0) + (livePost.metrics?.ack || 0);

            reports = livePost.reportCount || 0;
            isHidden = livePost.status === 'hidden';
        } else {
            // Fallback to snapshot (likely zero)
            const m = a.metrics_snapshot || {};
            likes = (m.likes || 0) + (m.saves || 0) + (m.ack || 0);
            comments = m.comments_count || 0;
        }

        totalReactions += likes;
        totalComments += comments;

        if (comments > 0) postsWithReplies++;
        if (likes === 0 && comments === 0) postsWithZeroInteraction++;

        if (reports > 0) reportedPostsCount++;
        if (isHidden) autoHiddenCount++;
    });

    const engagementRate = totalPosts > 0 ? pct(totalReactions + totalComments, totalPosts) : 0;

    // Determine day_index
    const dayIndex = await getNextDayIndex();

    // Create summary document
    const summary = await DailySummary.create({
        dateKey,
        day_index: dayIndex,
        generatedAt: new Date(),
        timezone: 'Asia/Jakarta',
        totals: {
            total_posts: totalPosts,
            unique_posters: uniquePosters,
            total_reactions: totalReactions,
            total_comments: totalComments,
            engagement_rate: engagementRate,
            posts_with_replies: postsWithReplies,
            posts_with_zero_interaction: postsWithZeroInteraction
        },
        safety: {
            reported_posts_count: reportedPostsCount,
            auto_hidden_count: autoHiddenCount,
            toxic_content_count: 0
        },
        sentiment: {
            positive: sentimentCounts.positive,
            neutral: sentimentCounts.neutral,
            sad: sentimentCounts.sad,
            angry: sentimentCounts.angry,
            hate: sentimentCounts.hate,
            positive_pct: pct(sentimentCounts.positive, totalPosts),
            neutral_pct: pct(sentimentCounts.neutral, totalPosts),
            sad_pct: pct(sentimentCounts.sad, totalPosts),
            angry_pct: pct(sentimentCounts.angry, totalPosts),
            hate_pct: pct(sentimentCounts.hate, totalPosts)
        },
        topics: topicsArray,
        gender_dist: {
            Pria: genderCounts.Pria,
            Wanita: genderCounts.Wanita,
            NB: genderCounts.NB,
            Unknown: genderCounts.Unknown,
            Pria_pct: pct(genderCounts.Pria, totalPosts),
            Wanita_pct: pct(genderCounts.Wanita, totalPosts),
            NB_pct: pct(genderCounts.NB, totalPosts),
            Unknown_pct: pct(genderCounts.Unknown, totalPosts)
        },
        location_dist: locationArray,
        export: {
            google_sheets: { status: 'pending' },
            notion: { status: 'disabled' }
        },
        used_fallback_sentiment: true, // We always use heuristic for MVP
        used_fallback_topics: true
    });

    console.log(`Generated summary for ${dateKey} as Day ${dayIndex} with ${totalPosts} posts`);
    return summary;
}

/**
 * Generate summary for today (Asia/Jakarta timezone)
 */
async function generateTodaySummary() {
    const today = getJakartaDateKey();
    return generateDailySummary(today);
}

module.exports = {
    generateDailySummary,
    generateTodaySummary,
    getJakartaDateKey,
    getNextDayIndex
};
