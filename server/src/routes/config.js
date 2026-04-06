const SystemSetting = require('../models/SystemSetting');

async function configRoutes(fastify, options) {
    // GET /public/settings - Retrieve settings for client use
    fastify.get('/public/settings', async (request, reply) => {
        try {
            // Only expose specific settings if needed, but for now all we have is non-sensitive
            const settings = await SystemSetting.find();
            return { success: true, settings };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });
}

module.exports = configRoutes;
