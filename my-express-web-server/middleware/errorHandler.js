const { baseLogger } = require('./logger')

const errorHandler = (err, req, res, next) => {
    // If headers are already sent, delegate to default Express handler
    if (res.headersSent) return next(err)

    // Derive status code
    let status = err.status || err.statusCode || res.statusCode || 500
    if (status < 400) status = 500

    // Normalize common DB errors
    if (err.name === 'ValidationError') status = 400
    if (err.name === 'CastError') status = 400
    if (err.code === 11000) status = 409 // duplicate key

    const isProd = process.env.NODE_ENV === 'production'
    const isClientError = status >= 400 && status < 500

    const logContext = {
        err,
        status,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        origin: req.headers.origin || '',
        ip: req.ip
    }

    // Log with appropriate severity
    const log = isClientError ? baseLogger.warn.bind(baseLogger) : baseLogger.error.bind(baseLogger)
    log(logContext, err.message || 'Unhandled error')

    // Build safe response
    const response = {
        error: {
            message: isProd && status >= 500 ? 'Internal Server Error' : (err.message || 'Error'),
            code: err.code || undefined,
            requestId: req.id
        }
    }
    if (!isProd) {
        response.error.stack = err.stack
        if (err.details) response.error.details = err.details
    }

    res.status(status).type('application/json').json(response)
}

module.exports = errorHandler 