# Dockerfile for React client — builds the app from source, then serves it via nginx.

FROM node:20-alpine AS build
WORKDIR /app

# The only env var the frontend actually reads at build time — the standalone backend's URL.
ARG REACT_APP_API_URL=https://solarcalc-backend.nbericmmsu.com
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html

ENV NODE_ENV=production

COPY --from=build /app/build/ .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
