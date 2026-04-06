const mongoose = require('mongoose');

const DailySummarySchema = new mongoose.Schema({
    dateKey: { type: String, required: true, unique: true }, // YYYY-MM-DD, unique constraint
    day_index: { type: Number, required: true }, // Sequential day number (Day 1, Day 2, ...)
    generatedAt: { type: Date, default: Date.now },
    timezone: { type: String, default: 'Asia/Jakarta' },

    // Totals
    totals: {
        total_posts: { type: Number, default: 0 },
        unique_posters: { type: Number, default: 0 },
        total_reactions: { type: Number, default: 0 },
        total_comments: { type: Number, default: 0 },
        engagement_rate: { type: Number, default: 0 }, // (reactions + comments) / posts
        posts_with_replies: { type: Number, default: 0 }, // New: for Pulse
        posts_with_zero_interaction: { type: Number, default: 0 } // New: for Funnel/Quality
    },

    // Safety & Trust (New Section)
    safety: {
        reported_posts_count: { type: Number, default: 0 },
        auto_hidden_count: { type: Number, default: 0 },
        toxic_content_count: { type: Number, default: 0 } // Placeholder for future use
    },

    // Sentiment Distribution
    sentiment: {
        positive: { type: Number, default: 0 },
        neutral: { type: Number, default: 0 },
        sad: { type: Number, default: 0 },
        angry: { type: Number, default: 0 },
        hate: { type: Number, default: 0 },
        positive_pct: { type: Number, default: 0 },
        neutral_pct: { type: Number, default: 0 },
        sad_pct: { type: Number, default: 0 },
        angry_pct: { type: Number, default: 0 },
        hate_pct: { type: Number, default: 0 }
    },

    // Topics Distribution (top topics)
    topics: [{
        name: { type: String },
        count: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
    }],

    // Gender Distribution
    gender_dist: {
        Pria: { type: Number, default: 0 },
        Wanita: { type: Number, default: 0 },
        NB: { type: Number, default: 0 },
        Unknown: { type: Number, default: 0 },
        Pria_pct: { type: Number, default: 0 },
        Wanita_pct: { type: Number, default: 0 },
        NB_pct: { type: Number, default: 0 },
        Unknown_pct: { type: Number, default: 0 }
    },

    // Location Distribution (top cities)
    location_dist: [{
        city: { type: String },
        count: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
    }],

    // Export Status
    export: {
        google_sheets: {
            status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
            last_error: { type: String, default: null },
            last_attempt_at: { type: Date, default: null }
        },
        notion: {
            status: { type: String, default: 'disabled' },
            last_error: { type: String, default: null },
            last_attempt_at: { type: Date, default: null }
        }
    },

    // Fallback Flags
    used_fallback_sentiment: { type: Boolean, default: false },
    used_fallback_topics: { type: Boolean, default: false }
});

// Index for quick lookups
DailySummarySchema.index({ dateKey: 1 });
DailySummarySchema.index({ day_index: 1 });

module.exports = mongoose.model('DailySummary', DailySummarySchema);
