const IntelPost = require('../models/IntelPost');
const { addHours, nextDay, nextSaturday, setHours, endOfDay } = require('date-fns');

// Spam filtering regex
const SPAM_PATTERNS = [
    /08[0-9]{8,}/, // Simple Indonesian phone number check
    /(\+62|62)[0-9]{8,}/,
    /wa\.me/,
    /whatsapp/i,
    /\bWA\b/i,
    /instagram\.com/,
    /@[\w._]+/, // Instagram/Twitter handles
    /http[s]?:\/\//,
    /www\./,
    /\.com/,
    /jl\.\s+/i, // "Jl. " pattern for addresses
    /jalan\s+/i,
    /dm\s+/i,
    /inbox\s+/i
];

const checkSpam = (content) => {
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(content)) return true;
    }
    return false;
};

// Calculate expires_at based on preset/type
const calculateExpiry = (type, preset) => {
    const now = new Date();

    if (type === 'HEADSUP') {
        // Heads-up fixed 8 hours
        return addHours(now, 8);
    }

    // Deal logic
    switch (preset) {
        case 'TODAY':
            // End of today (or 24h as fallback if close to midnight? Let's do 24h for simplicity per spec "expires in 24h" or actual end of day? 
            // Spec says "TODAY (expires in 24h)", checking spec... "TODAY (expires in 24h)"
            return addHours(now, 24);
        case 'TOMORROW':
            return addHours(now, 36);
        case 'WEEKEND':
            // If today is sat/sun, +48h cap. Else next saturday.
            // Spec says "expires in 48h, cap at 48h for MVP". Simple 48h.
            return addHours(now, 48);
        case '48H':
            return addHours(now, 48);
        default:
            return addHours(now, 24);
    }
};

const intelRoutes = async (fastify, options) => {

    // POST /intel - Create new intel
    fastify.post('/intel', async (request, reply) => {
        const { type, content, city, area, anon_id, lat, long, deal_meta, headsup_meta } = request.body;

        // 1. Validation
        if (!content || !type || !city || !anon_id) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        if (content.length > 160) {
            return reply.code(400).send({ error: 'Content too long' });
        }

        // 2. Spam Check
        if (checkSpam(content)) {
            return reply.code(400).send({
                error: 'Maaf, hindari nomor/link/alamat lengkap ya. Biar tetap anonim.',
                code: 'SPAM_DETECTED'
            });
        }

        // 3. Rate Limiting (Basic query check)
        // Deal: 1 per 30m, Headsup: 1 per 10m
        const rateWindow = type === 'DEAL' ? 30 : 10;
        const timeAgo = new Date(Date.now() - rateWindow * 60 * 1000);

        const recentPost = await IntelPost.findOne({
            anon_id,
            type,
            created_at: { $gt: timeAgo }
        });

        if (recentPost) {
            return reply.code(429).send({ error: `Tunggu sebentar lagi sebelum posting ${type} baru.` });
        }

        // 4. Expiry Calculation
        const expires_at = calculateExpiry(type, deal_meta?.validity_preset);

        // 5. Create Post
        const newIntel = new IntelPost({
            type,
            content,
            city: city || 'Unknown',
            area,
            anon_id,
            expires_at,
            metrics: { saves: 0, ack: 0 },
            distance_bucket: 'NEARBY', // Default fallback
            deal_meta: type === 'DEAL' ? deal_meta : undefined,
            headsup_meta: type === 'HEADSUP' ? headsup_meta : undefined
        });

        if (lat && long) {
            newIntel.location = { type: 'Point', coordinates: [parseFloat(long), parseFloat(lat)] };
            // Note: distance_bucket should ideally be calculated relative to *viewer*, 
            // but for storage we just defaulting. The *read* endpoint calculates it.
        }

        await newIntel.save();
        return newIntel;
    });

    // GET /intel - Read active intel
    fastify.get('/intel', async (request, reply) => {
        const { city, type, lat, long, radius, anon_id } = request.query;

        let pipeline = [];
        const meters = radius ? parseInt(radius) : 10000; // Default 10km

        // 1. Geo Filter (First Stage)
        if (lat && long) {
            pipeline.push({
                $geoNear: {
                    near: { type: "Point", coordinates: [parseFloat(long), parseFloat(lat)] },
                    distanceField: "distance",
                    maxDistance: meters,
                    spherical: true,
                    query: { status: 'ACTIVE' }
                }
            });
        } else {
            pipeline.push({ $match: { status: 'ACTIVE' } });
            if (city) pipeline.push({ $match: { city: city } });
        }

        // 2. Type Filter
        if (type && type !== 'ALL') {
            pipeline.push({ $match: { type: type } });
        }

        // 3. Sort (Recency + Score ideally, for MVP just recency)
        pipeline.push({ $sort: { created_at: -1 } });
        pipeline.push({ $limit: 30 });

        const posts = await IntelPost.aggregate(pipeline);

        // 4. Compute Distance Bucket for each post
        // distanceField 'distance' is in meters from $geoNear
        const mappedPosts = posts.map(p => {
            let bucket = 'NEARBY';
            if (p.distance) {
                if (p.distance < 50) bucket = '< 50m';
                else if (p.distance < 500) bucket = '< 500m';
                else if (p.distance < 2000) bucket = '< 2km';
                else bucket = '< 10km';
            }
            return { ...p, distance_bucket: bucket };
        });

        return mappedPosts;
    });

    // POST /intel/:id/action - Actions
    fastify.post('/intel/:id/action', async (request, reply) => {
        const { id } = request.params;
        const { action, anon_id } = request.body;
        // Actions: save, unsave, ack, direction_click, update_click

        /* 
          Real-world apps would track user-post interactions to prevent double-counting.
          For MVP, we just increment counters on the post document.
          Exept 'save', we might want to track 'saved' state?
          The prompt says "Actions update metrics".
          "Simpan (toggle)" implies state. 
          For this MVP, we'll just return the updated metric 
          and assume client manages local state or we'll assume fire-and-forget metrics 
          except for simple counters.
        */

        let update = {};

        switch (action) {
            case 'save': update = { $inc: { "metrics.saves": 1 } }; break;
            case 'unsave': update = { $inc: { "metrics.saves": -1 } }; break;
            case 'ack': update = { $inc: { "metrics.ack": 1 } }; break;
            case 'direction_click': update = { $inc: { "metrics.direction_clicks": 1 } }; break;
            case 'update_click': update = { $inc: { "metrics.updates": 1 } }; break;
            default: return reply.code(400).send({ error: 'Invalid action' });
        }

        const updatedPost = await IntelPost.findOneAndUpdate(
            { intel_id: id },
            update,
            { new: true }
        );

        if (!updatedPost) return reply.code(404).send({ error: 'Not found' });
        return updatedPost;
    });
};

module.exports = intelRoutes;
