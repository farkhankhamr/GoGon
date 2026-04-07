const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Helper to get current date in Asia/Jakarta timezone as YYYY-MM-DD
const getJakartaDateKey = () => {
    const now = new Date();
    const jakartaOffset = 7 * 60; // UTC+7 in minutes
    const jakartaTime = new Date(now.getTime() + (jakartaOffset + now.getTimezoneOffset()) * 60000);
    return jakartaTime.toISOString().split('T')[0];
};

const PostSchema = new mongoose.Schema({
    post_id: { type: String, default: uuidv4, unique: true },
    anon_id: { type: String, required: true },
    content: { type: String, required: true, maxLength: 500 },
    city: { type: String, required: true, index: true },
    institution: { type: String, default: null },
    topic: { type: String, default: null },
    gender: { type: String, enum: ['M', 'F', 'NB', 'Pria', 'Wanita', null], default: null },
    occupation: { type: String, default: null },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
    },

    // Post Type
    type: { type: String, enum: ['CURHAT', 'DEAL', 'HEADSUP'], default: 'CURHAT' },

    // Timestamps
    created_at: { type: Date, default: Date.now },
    createdDateKey: { type: String, default: getJakartaDateKey, index: true }, // YYYY-MM-DD Asia/Jakarta
    expires_at: { type: Date, required: true, index: { expires: 0 } },

    // Status & Moderation
    status: { type: String, enum: ['active', 'hidden'], default: 'active' },
    reportCount: { type: Number, default: 0 },
    is_seed: { type: Boolean, default: false },

    // Metrics
    likes: { type: Number, default: 0 }, // Keep for backward compatibility
    comments_count: { type: Number, default: 0 },
    metrics: {
        likes: { type: Number, default: 0 },
        comments_count: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        ack: { type: Number, default: 0 },
        direction_clicks: { type: Number, default: 0 },
        chat_started: { type: Number, default: 0 },
        chat_accepted: { type: Number, default: 0 }
    },

    // Content Analysis
    sentiment: { type: String, enum: ['positive', 'neutral', 'sad', 'angry', 'hate', null], default: null },
    topic_tags: [{ type: String }]
});

// Index for daily summary queries
PostSchema.index({ createdDateKey: 1, status: 1 });

module.exports = mongoose.model('Post', PostSchema);
