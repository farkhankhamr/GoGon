const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Helper to get current date in Asia/Jakarta timezone as YYYY-MM-DD
const getJakartaDateKey = () => {
    const now = new Date();
    const jakartaOffset = 7 * 60; // UTC+7 in minutes
    const jakartaTime = new Date(now.getTime() + (jakartaOffset + now.getTimezoneOffset()) * 60000);
    return jakartaTime.toISOString().split('T')[0];
};

const PostAuditSchema = new mongoose.Schema({
    audit_id: { type: String, default: uuidv4, unique: true },
    post_id: { type: String, required: true, index: true },
    anon_id_hash: { type: String, required: true, index: true }, // SHA-256 hash of anon_id

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    createdDateKey: { type: String, required: true, index: true }, // YYYY-MM-DD Asia/Jakarta

    // Post Metadata
    gender: { type: String, default: null },
    city: { type: String, required: true },
    type: { type: String, enum: ['CURHAT', 'DEAL', 'HEADSUP'], default: 'CURHAT' },

    // Content Analysis (computed at creation)
    sentiment: { type: String, enum: ['positive', 'neutral', 'sad', 'angry', 'hate', null], default: null },
    topic_tags: [{ type: String }],

    // Metrics Snapshot (captured at audit creation, can be updated)
    metrics_snapshot: {
        likes: { type: Number, default: 0 },
        comments_count: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        ack: { type: Number, default: 0 },
        direction_clicks: { type: Number, default: 0 },
        chat_started: { type: Number, default: 0 },
        chat_accepted: { type: Number, default: 0 }
    }
});

// Compound index for daily summary queries
PostAuditSchema.index({ createdDateKey: 1 });

// Static helper to hash anon_id
PostAuditSchema.statics.hashAnonId = function (anon_id) {
    return crypto.createHash('sha256').update(anon_id).digest('hex');
};

module.exports = mongoose.model('PostAudit', PostAuditSchema);
