const { createServer } = require('http');
const { gEnv, normalizePort } = require('./src/utils/env');
const logger = require('./src/utils/logger');
const app = require('./src/app');
const { connectToDB } = require('./src/config/db')
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('💥 Uncaught Exception! Shutting down...', err);
    process.exit(1);
});

// Normalize and set port
const port = normalizePort(gEnv('PORT', 8080));
app.set('port', port);
const server = createServer(app);

// Handle server errors
const onError = (error) => {
    if (error.syscall !== 'listen') throw error;

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
        case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
};

// Handle successful server start
const onListening = () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    logger.info(`🚀 Server is running on ${bind}`);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('💥 Unhandled Rejection! Shutting down...', err);
    server.close(() => process.exit(1));
});

const start = async () => {
    await connectToDB(); // ⬅️ Connect to DB before starting the server
    server.listen(port);
};

server.on('error', onError);
server.on('listening', onListening);

start(); // ⬅️ Start the server after DB is ready
