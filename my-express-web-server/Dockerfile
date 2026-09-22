# Dockerfile for Node Express Backend

FROM node:20-alpine3.17

# Create App Directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install Dependencies
COPY package*.json ./

ENV NODE_ENV=production
RUN npm ci --omit=dev

# Copy app source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Port is set by PORT in .env (4001 by default) — keep this in sync if that changes.
EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4001/livez || exit 1

# Start the application
CMD ["node", "server.js"]