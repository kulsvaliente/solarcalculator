const { signAdminToken } = require('../utils/adminToken')

// Single hardcoded admin account (ADMIN_EMAIL/ADMIN_PASSWORD env vars) — no user system,
// just a gate for the ratings admin view (see RatingsPanel.jsx on the frontend).
const login = (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const adminPassword = String(process.env.ADMIN_PASSWORD || '')

    if (!adminEmail || !adminPassword) {
        return res.status(503).json({ message: 'Admin login is not configured' })
    }
    if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ message: 'Invalid admin credentials' })
    }

    const token = signAdminToken()
    return res.json({ token })
}

module.exports = { login }
