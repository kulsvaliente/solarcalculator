// Thin server-side passthroughs for third-party APIs whose keys must not ship to the
// browser: OpenCage (reverse geocoding), Groq (AI chatbot), NREL PVWatts (solar irradiance).

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch() with a couple of retries on transient network failures (DNS blips, connection
 * resets) — these upstreams occasionally fail for a moment and succeed right after, so a
 * bare single attempt surfaces avoidable errors to the user.
 */
const fetchWithRetry = async (url, options, { retries = 2, backoffMs = 300 } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(backoffMs * (attempt + 1));
      }
    }
  }
  throw lastError;
};

const reverseGeocode = async (req, res) => {
  const lat = Number(req.body?.lat ?? req.query?.lat);
  const lng = Number(req.body?.lng ?? req.query?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ message: 'lat and lng are required' });
  }

  const apiKey = process.env.OPENCAGE_API_KEY;
  if (!apiKey) {
    return res.status(502).json({ message: 'Geocoding is not configured' });
  }

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;
    const response = await fetchWithRetry(url);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Reverse geocode proxy failed:', error);
    return res.status(502).json({ message: 'Failed to reach geocoding service' });
  }
};

const aiChat = async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(502).json({ message: 'AI assistant is not configured' });
  }

  try {
    const response = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('AI chat proxy failed:', error);
    return res.status(502).json({ message: 'Failed to reach AI assistant service' });
  }
};

const getIrradiance = async (req, res) => {
  const {
    latitude,
    longitude,
    tilt = 0,
    azimuth = 180,
    systemCapacity = 1,
    arrayType = 1,
    moduleType = 1,
    losses = 20
  } = req.body || {};

  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return res.status(400).json({ message: 'latitude and longitude are required' });
  }

  const apiKey = process.env.NREL_API_KEY;
  if (!apiKey) {
    return res.status(502).json({ message: 'Irradiance data is not configured' });
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      lat: String(latitude),
      lon: String(longitude),
      system_capacity: String(systemCapacity),
      azimuth: String(azimuth),
      tilt: String(tilt),
      array_type: String(arrayType),
      module_type: String(moduleType),
      losses: String(losses)
    });

    // NREL's developer API domain migrated from developer.nrel.gov to developer.nlr.gov
    // (the old domain was retired May 2026) — this is the current, correct host.
    const response = await fetchWithRetry(`https://developer.nlr.gov/api/pvwatts/v8.json?${params}`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Irradiance proxy failed:', error);
    return res.status(502).json({ message: 'Failed to reach irradiance data service' });
  }
};

module.exports = { reverseGeocode, aiChat, getIrradiance };
