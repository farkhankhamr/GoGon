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

// Database
connectDB();


// Routes
fastify.register(require('./routes/posts'));
fastify.register(require('./routes/comments'));
fastify.register(require('./routes/intel'));
fastify.register(require('./routes/reports'));
fastify.register(require('./routes/admin'));
fastify.register(require('./routes/config'));

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
