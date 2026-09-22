const { baseLogger } = require('../middleware/logger')

/**
 * Forwards a request to arecgis's live API so evaluations (ratings) and solar logs
 * (activity logs) keep landing in the arecgis admin account, even though this backend
 * is otherwise standalone. ARECGIS_API_KEY is optional — attached only if configured,
 * since it isn't yet known whether arecgis's endpoints require auth.
 */
const forwardToArecgis = (resourcePath) => async (req, res) => {
  const baseUrl = process.env.ARECGIS_API_URL
  if (!baseUrl) {
    baseLogger.error('ARECGIS_API_URL is not configured; cannot forward %s', resourcePath)
    return res.status(502).json({ message: 'Upstream (arecgis) is not configured' })
  }

  const idSuffix = req.params?.id ? `/${req.params.id}` : ''
  const query = new URLSearchParams(req.query || {}).toString()
  const url = `${baseUrl.replace(/\/+$/, '')}${resourcePath}${idSuffix}${query ? `?${query}` : ''}`

  const headers = { 'Content-Type': 'application/json' }
  if (process.env.ARECGIS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.ARECGIS_API_KEY}`
  }

  try {
    const upstreamResponse = await fetch(url, {
      method: req.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
    })

    const contentType = upstreamResponse.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
      ? await upstreamResponse.json()
      : await upstreamResponse.text()

    return res.status(upstreamResponse.status).send(payload)
  } catch (err) {
    baseLogger.error({ err, url }, 'Failed to forward request to arecgis')
    return res.status(502).json({ message: 'Failed to reach arecgis upstream' })
  }
}

module.exports = { forwardToArecgis }
