const Response = require('./Response_handler');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger'); // Assume winston is here

module.exports = (fn) => async (req, res, next) => {
    try {
        const result = await fn(req, res, next);

        // If response already sent by the handler, skip
        if (res.headersSent) return;

        const {
            data,
            statusCode = 200,
            message = 'API executed successfully',
        } = result || {};

        // If data is undefined or null, throw an API error
        if (data === undefined || data === null) {
            throw new AppError('API execution failed — no data returned', 500, true, 'API_EMPTY_RESPONSE');
        }

        // Success response
        Response.sendSuccess(res, data, statusCode, message);

    } catch (err) {
        if (res.headersSent) return;

        if (err instanceof AppError) {
            return AppError.handle(err, req, res, next);
        }

        // Unexpected error: log it
        logger.error('[Unhandled Async Error]', {
            message: err.message,
            stack: err.stack,
            route: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });

        return next(err); // Pass to global error middleware
    }
};
