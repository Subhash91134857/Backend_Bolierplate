const AppError = require("./AppError");
const logger = require('./logger');
const { gEnv } = require('./env');

class Response {
    static handleValidationErrorDB(err) {
        const message = err.message.split(': ').pop();
        return new AppError(message, 400, true, "DATABASE_VALIDATION_ERROR");
    }

    static handleCastErrorDB(err) {
        const message = `Invalid value: ${err.value} for path: ${err.path}.`;
        return new AppError(message, 400, true, "CAST_ERROR");
    }

    static handleDuplicateKeyErrorDB(err) {
        const fields = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'unknown fields';
        const message = `Duplicate value for field(s): ${fields}. Please use different value(s).`;
        return new AppError(message, 409, true, "DUPLICATE_KEY");
    }

    static handleJWTError() {
        return new AppError('Invalid token. Please login again.', 401, true, "INVALID_TOKEN");
    }

    static handleJWTExpireError() {
        return new AppError('Your token has expired. Please login again.', 401, true, "EXPIRED_TOKEN");
    }

    static dev(err, req, res) {
        return res.status(err.statusCode).json({
            isSuccess: false,
            status: err.status,
            message: err.message,
            method: req.method,
            url: req.originalUrl,
            error: {
                name: err.name,
                errorCode: err.errorCode,
                details: err,
                stack: err.stack,
            },
        });
    }

    static prod(err, req, res) {
        // In production, avoid leaking internal errors unless operational
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                isSuccess: false,
                status: err.status,
                message: err.message,
                errorCode: err.errorCode || 'ERROR',
            });
        }

        // Log internal error
        logger.error(`[UnhandledError] ${err.message}`, {
            name: err.name,
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });

        // Respond with generic message
        return res.status(500).json({
            isSuccess: false,
            status: 'error',
            message: 'Something went wrong. Please try again later.',
            errorCode: 'INTERNAL_SERVER_ERROR',
        });
    }

    static sendSuccess(res, data, statusCode = 200, message = 'Request successful') {
        return res.status(statusCode).json({
            isSuccess: true,
            status: 'success',
            message,
            data,
        });
    }

    static sendError(err, req, res) {
        err.statusCode = err.statusCode || 500;
        err.status = `${err.statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Convert known DB and JWT errors
        if (err.name === 'ValidationError') err = Response.handleValidationErrorDB(err);
        if (err.name === 'CastError') err = Response.handleCastErrorDB(err);
        if (err.name === 'JsonWebTokenError') err = Response.handleJWTError();
        if (err.name === 'TokenExpiredError') err = Response.handleJWTExpireError();
        if (err.code === 11000) err = Response.handleDuplicateKeyErrorDB(err);

        const isDev = gEnv('NODE_ENV', 'development') === 'development';

        return isDev ? Response.dev(err, req, res) : Response.prod(err, req, res);
    }
}

module.exports = Response;
