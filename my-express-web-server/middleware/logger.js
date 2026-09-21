const pino = require('pino')
const pinoHttp = require('pino-http')
const { v4: uuid } = require('uuid')

const isProduction = process.env.NODE_ENV === 'production'

const baseLogger = pino({
    level: isProduction ? 'info' : 'debug',
    transport: isProduction ? undefined : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' }
    },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'password',
            'token',
            'refreshToken'
        ],
        remove: true
    },
    base: { service: 'arec-api', env: process.env.NODE_ENV || 'development' }
})

const logger = pinoHttp({
    logger: baseLogger,
    genReqId: (req) => req.headers['x-request-id'] || uuid(),
    customProps: (req, res) => ({
        requestId: req.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    })
})

module.exports = { logger, baseLogger }

