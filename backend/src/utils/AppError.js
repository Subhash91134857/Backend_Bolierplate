const logger = require('./logger');
const { gEnv } = require('./env');

class AppError extends Error {
    constructor(message, statusCode, isOperational = true, errorCode = 'UNKNOWN_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;
        this.isFunctional = true;
        this.errorCode = errorCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }


    static handle(error, req, res, next) {
        const isFrontend = AppError.isFrontendRequest(req);
        const isDev = gEnv(NODE_ENV);
        const errorToLog = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            errorCode: error.errorCode,
            url: req.orginalUrl,
            method: req.method,
            ip: req.ip,
        };

        if (error instanceof AppError) {
            // log AppErrors
            logger.warn(`[AppError] ${error.message}`, errorToLog);

            if (isFrontend) {
                Response.sendError(error, req, res, next);
            } else {
                res.status(error.statusCode).json({
                    status: error.status,
                    message: error.message,
                    errorCode: error.errorCode,
                    ...(isDev && { stack: error.stack }),
                });
            }
        } else {
            // log unhandled or system error

            logger.error(`[UnhandledError] ${error.message}`, errorToLog);

            const genericError = new AppError('Internal Server Error', 500, false, 'UNHANDLED_EXCEPTION');

            if (isFrontend) {
                Response.sendError(genericError, req, res, next);
            } else {
                res.status(500).json({
                    status: 'error',
                    message: genericError.message,
                    errorCode: genericError.errorCode,
                    ...(isDev && { stack: error.stack }),
                });
            }
        }
    }
    static isFrontendRequest(req) {
        const userAgent = req.headers['user-agent'] || '';
        const referer = req.headers.referer || '';
        const isBot = /bot|crawl|spider/i.test(userAgent) || referer.includes('google.com');
        const isBrowser = /Mozilla|Chrome|Safari|Edge|Firefox/i.test(userAgent);
        return isBrowser && !isBot;
    }
}

module.exports = AppError;
