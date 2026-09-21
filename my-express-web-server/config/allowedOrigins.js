const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  : [];

module.exports = allowedOrigins