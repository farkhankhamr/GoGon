const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const intelPostSchema = new mongoose.Schema({
    intel_id: { type: String, default: uuidv4, unique: true },
    anon_id: { type: String, required: true }, // from localStorage

    type: {
        type: String,
        required: true,
        enum: ['DEAL', 'HEADSUP']
    },

    status: {
        type: String,
        enum: ['ACTIVE', 'HIDDEN'],
        default: 'ACTIVE'
    },

    // Content & Location
    content: { type: String, required: true, maxLength: 160 },
    city: { type: String, required: true },
    area: { type: String, default: null }, // from 'Semua Area' dropdown

    // Coarse distance bucket stored for fast filtering/display
    // Calculated at creation time relative to user's position
    distance_bucket: {
        type: String,
        enum: ['LT_50M', 'LT_500M', 'LT_2KM', 'NEARBY'],
        default: 'NEARBY'
    },

    // Geospatial for finding nearby intel (actual search)
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
    },

    // Timestamps
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true, index: { expires: 0 } }, // TTL Index

    // Metrics
    metrics: {
        saves: { type: Number, default: 0 },
        direction_clicks: { type: Number, default: 0 },
        ack: { type: Number, default: 0 },
        updates: { type: Number, default: 0 },
        reports: { type: Number, default: 0 }
    },

    // Deal Specific Meta
    deal_meta: {
        validity_preset: {
            type: String,
            enum: ['TODAY', 'TOMORROW', 'WEEKEND', '48H'],
            required: function () { return this.type === 'DEAL'; }
        },
        place_hint: {
            type: String,
            enum: ['MALL', 'CAFE', 'RESTO', 'MINIMARKET', 'CAMPUS', 'OFFICE', 'OTHER', null],
            default: null
        },
        seen_directly: { type: Boolean, default: true }
    },

    // Heads-up Specific Meta
    headsup_meta: {
        heads_up_type: {
            type: String,
            enum: ['RAME', 'ANTRI', 'TUTUP', 'PARKIR_SUSAH', 'BISING', null],
            required: function () { return this.type === 'HEADSUP'; }
        }
    }
});

// Compound index for efficient querying
intelPostSchema.index({ city: 1, status: 1, created_at: -1 });

module.exports = mongoose.model('IntelPost', intelPostSchema);
