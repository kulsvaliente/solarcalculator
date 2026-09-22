require('dotenv').config()
require('express-async-errors')
const express = require('express')
const app = express()
const path = require('path')
const { logger, baseLogger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const setupSwagger = require('./swagger') // Import the Swagger setup
const PORT = process.env.PORT || 3001
const helmet = require('helmet')
const compression = require('compression')
const hpp = require('hpp')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const { monitorEventLoopDelay } = require('perf_hooks')

mongoose.set('strictQuery', true)

console.log(process.env.NODE_ENV)

connectDB()

// Assert critical environment variables in production
const validateEnv = () => {
    if (process.env.NODE_ENV !== 'production') return
    const required = ['SECRET_KEY', 'ALLOWED_ORIGINS', 'DATABASE_URI']
    const missing = required.filter(k => !process.env[k] || String(process.env[k]).length < 8)
    if (missing.length) {
        baseLogger.fatal({ missing }, 'Missing or weak required environment variables')
        process.exit(1)
    }
    const proxyKeys = ['OPENCAGE_API_KEY', 'GROQ_API_KEY', 'NREL_API_KEY']
    const missingProxyKeys = proxyKeys.filter(k => !process.env[k])
    if (missingProxyKeys.length) {
        baseLogger.warn({ missingProxyKeys }, 'Third-party proxy keys not configured — those features will return 502')
    }
    const adminKeys = ['ADMIN_EMAIL', 'ADMIN_PASSWORD']
    const missingAdminKeys = adminKeys.filter(k => !process.env[k])
    if (missingAdminKeys.length) {
        baseLogger.warn({ missingAdminKeys }, 'Admin login not configured — POST /admin/login will return 503')
    }
}
validateEnv()

app.use(logger)
app.use((req, res, next) => {
    if (req.id) res.setHeader('X-Request-ID', req.id)
    next()
})
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        useDefaults: true,
        directives: (() => {
            const connectSrc = ["'self'"].concat((process.env.CSP_CONNECT_SRC || '').split(',').map(s => s.trim()).filter(Boolean))
            return {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc,
                frameAncestors: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        })()
    } : false
}))
app.use(compression())
app.use(hpp())
app.use(mongoSanitize())
app.use(xss())

app.use(cors(corsOptions))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Global rate limiter for write endpoints
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(['/solar-calculator-activity-logs', '/solar-calculator-ratings'], (req, res, next) => {
    if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
        return writeLimiter(req, res, next)
    }
    next()
})

// Rate limit the third-party proxy endpoints (geo/AI/irradiance) — they fire on normal map
// interaction, not just writes, so this is more generous than the ratings/logs write limiter,
// but still protects the underlying API keys from abuse.
const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
})
app.use('/api', proxyLimiter)

// Tight limiter on the admin login attempt itself — this is the brute-force target.
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
})
app.use('/admin/login', adminLoginLimiter)

// Set up Swagger documentation (restrict in production)
if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app)
}

app.use('/', express.static(path.join(__dirname, '/public')))
app.use('/', require('./routes/root'))
app.use('/settings', require('./routes/settingsRoutes'))
app.use('/pricing', require('./routes/pricingRoutes'))
app.use('/solar-calculator-activity-logs', require('./routes/solarCalculatorActivityLogRoutes'))
app.use('/solar-calculator-ratings', require('./routes/solarCalculatorRatingRoutes'))
app.use('/api', require('./routes/proxyRoutes'))
app.use('/admin', require('./routes/adminAuthRoutes'))

// Liveness
app.get('/livez', (req, res) => res.sendStatus(200))
app.head('/livez', (req, res) => res.sendStatus(200))

// Event loop monitor for readiness
const loopLag = monitorEventLoopDelay({ resolution: 20 })
loopLag.enable()

const withTimeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
])

let healthCache = { at: 0, status: 200, body: { status: 'ok' } }

const readinessCheck = async () => {
    const result = {}
    let ok = true

    // DB connectivity and ping
    try {
        const connected = mongoose.connection.readyState === 1
        let pingOk = false
        if (connected && mongoose.connection.db) {
            const admin = mongoose.connection.db.admin()
            const ping = await withTimeout(admin.ping(), 1000)
            pingOk = ping && (ping.ok === 1 || ping.result === 1)
        }
        result.db = { connected, ping: pingOk }
        ok = ok && connected && pingOk
    } catch (e) {
        result.db = { connected: false, ping: false }
        ok = false
    }

    const mem = process.memoryUsage()
    result.process = {
        pid: process.pid,
        uptime: process.uptime(),
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        eventLoopLagMs: Number(loopLag.mean / 1e6).toFixed(2),
        node: process.version
    }

    result.build = {
        version: require('./package.json').version,
        commit: process.env.GIT_SHA || 'unknown',
        env: process.env.NODE_ENV
    }

    result.status = ok ? 'ok' : 'degraded'
    const status = ok ? 200 : 503
    return { status, body: result }
}

// Readiness and health checks
app.get('/readyz', async (req, res) => {
    if (Date.now() - healthCache.at < 5000) {
        return res.status(healthCache.status).json(healthCache.body)
    }
    const outcome = await readinessCheck()
    healthCache = { at: Date.now(), ...outcome }
    return res.status(outcome.status).json(outcome.body)
})
app.head('/readyz', async (req, res) => {
    if (Date.now() - healthCache.at < 5000) {
        return res.sendStatus(healthCache.status)
    }
    const outcome = await readinessCheck()
    healthCache = { at: Date.now(), ...outcome }
    return res.sendStatus(outcome.status)
})
app.get('/healthz', async (req, res) => {
    if (Date.now() - healthCache.at < 5000) {
        return res.status(healthCache.status).json(healthCache.body)
    }
    const outcome = await readinessCheck()
    healthCache = { at: Date.now(), ...outcome }
    return res.status(outcome.status).json(outcome.body)
})

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: "404 not found" })
    } else {
        res.type('txt').send('404 not found')
    }
})

app.use(errorHandler)

mongoose.connection.once('open', async () => {
    baseLogger.info('Connected to MongoDB')
    const server = app.listen(PORT, () => {
        baseLogger.info({ port: PORT }, 'Server listening')
    })
    // Graceful shutdown
    const shutdown = (signal) => {
        baseLogger.warn({ signal }, 'Shutting down gracefully')
        server.close(() => {
            mongoose.connection.close(false, () => process.exit(0))
        })
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
})

mongoose.connection.on('error', err => {
    baseLogger.error({ err }, 'MongoDB connection error')
})

// Global process error handlers
process.on('unhandledRejection', (reason) => {
    baseLogger.fatal({ reason }, 'Unhandled Promise rejection')
})
process.on('uncaughtException', (err) => {
    baseLogger.fatal({ err }, 'Uncaught Exception')
    process.exit(1)
})