require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');
const connectDB = require('./db');

// Plugins
fastify.register(require('@fastify/cors'), {
    origin: '*', // Allow all for MVP / H5 wrapper
});

fastify.register(require('fastify-socket.io'), {
    cors: {
        origin: "*",
    }
});

// Serve static files (Frontend)
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../public'),
    prefix: '/', // serve at root
});

// Database
connectDB();


// Routes
fastify.register(require('./routes/posts'), { prefix: '/api' });
fastify.register(require('./routes/comments'), { prefix: '/api' });
fastify.register(require('./routes/intel'), { prefix: '/api' });
fastify.register(require('./routes/reports'), { prefix: '/api' });
fastify.register(require('./routes/admin'), { prefix: '/api' });
fastify.register(require('./routes/config'), { prefix: '/api' });

// SPA Fallback: Any route not handled by API or static files should serve index.html
fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.url.startsWith('/api')) {
        reply.code(404).send({ error: 'API route not found' });
    } else {
        reply.sendFile('index.html');
    }
});

// Socket.IO Logic
fastify.ready(err => {
    if (err) throw err;
    require('./socket')(fastify.io);
});

// Start Server
const start = async () => {
    try {
        await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
        console.log(`Server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
