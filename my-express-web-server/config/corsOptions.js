const allowedOrigins = require('./allowedOrigins')

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, health checks) and
        // anything explicitly listed in ALLOWED_ORIGINS.
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-key'],
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions