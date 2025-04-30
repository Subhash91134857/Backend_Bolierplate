const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');


const AppError = require('./utils/AppError');
const RequestLogger = require('./middleware/request-logger');
const Response = require('./utils/Response_handler');
const Route = require('./routes/index');
const { gEnv } = require('./utils/env');

const app = express();

// Disable unnecessary headers
app.disable('etag').disable('x-powered-by');

// Serve static files
app.use('/static', express.static(path.join(__dirname, '../public')));

// CORS Configuration
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));

app.options('/api', cors());

// Logging requests in development
if (gEnv('NODE_ENV') !== 'production') {
    app.use(RequestLogger);
}

// Set secure HTTP headers
app.use(helmet());

// Rate limiting to prevent abuse
app.use('/api', rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again later.',
}));

// Body parser and data sanitization
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(xss());

// Prevent parameter pollution
app.use(hpp({ whitelist: [] }));

// Response compression
app.use(compression());

// API Routes
Route(app);

// Handle undefined routes
app.use('/*\w', (req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404, true, 'ROUTE_NOT_FOUND'));
});

// Global error handler
app.use(Response.sendError);

module.exports = app;
