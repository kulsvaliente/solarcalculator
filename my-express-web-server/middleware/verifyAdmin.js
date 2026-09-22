const { verifyAdminToken } = require('../utils/adminToken')

const verifyAdmin = (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!verifyAdminToken(token)) {
        return res.status(401).json({ message: 'Admin authentication required' })
    }
    next()
}

module.exports = verifyAdmin
