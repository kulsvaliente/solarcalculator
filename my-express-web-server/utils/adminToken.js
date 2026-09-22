const crypto = require('crypto')

// Signs a short-lived token proving admin login, using the app's existing SECRET_KEY.
// No session store needed — the signature + embedded expiry is self-verifying.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

const signAdminToken = () => {
    const payloadB64 = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url')
    const sig = crypto.createHmac('sha256', process.env.SECRET_KEY).update(payloadB64).digest('base64url')
    return `${payloadB64}.${sig}`
}

const verifyAdminToken = (token) => {
    if (!token || typeof token !== 'string' || !token.includes('.')) return false
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return false

    const expectedSig = crypto.createHmac('sha256', process.env.SECRET_KEY).update(payloadB64).digest('base64url')
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false

    try {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
        return Number(payload.exp) > Date.now()
    } catch {
        return false
    }
}

module.exports = { signAdminToken, verifyAdminToken }
