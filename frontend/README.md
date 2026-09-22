# Solar Rooftop Calculator — Frontend

React frontend for the Solar Rooftop Calculator. See the [repo root README](../README.md) for
the overall architecture (this app + its standalone `my-express-web-server` backend).

## Stack

- React 18, React Router v6
- MUI 5 (Material UI), custom theme (Poppins), CssBaseline
- Redux Toolkit + RTK Query for data fetching/cache
- Leaflet + react-leaflet + Leaflet-Geoman for the map and roof-area drawing tools
- Framer Motion for page transitions

## Quick start

```bash
npm install
npm start
```
Runs on http://localhost:3000 (see `.env` — `PORT`).

Build for production:
```bash
npm run build
```
Output goes to `build/`.

Run with Docker:
```bash
docker build -t solarcalc-frontend --build-arg REACT_APP_API_URL=https://solarcalc-backend.nbericmmsu.com .
docker run -p 8080:80 solarcalc-frontend
```

## Configuration

Copy `.env.example` to `.env` and set:
- `REACT_APP_API_URL` — the standalone backend's URL (`my-express-web-server`, default
  `https://solarcalc-backend.nbericmmsu.com`). This is the *only* env var the app reads; every third-party API key
  (Groq, OpenCage, NREL) is proxied through the backend instead of living in this app.

## Project structure

```
src/
  app/                 # Redux store, base RTK Query api slice
  components/          # Shared UI (landing page, layouts, error boundaries)
  config/              # Top app bar
  features/
    settings/          # Settings RTK Query slice
    pricing/            # Pricing RTK Query slice
    solar-calculator/   # The calculator itself: map, inputs, results, What-If, analysis, print
  hooks/               # Custom hooks (useTitle, etc.)
  lib/                 # monitoring.js (error reporting hook, currently a no-op stub)
  index.js, App.js     # Entrypoint, theme, routing + page transitions
```

## Deployment

As static assets served by nginx — use the provided `Dockerfile` (multi-stage: builds the app,
then serves it via nginx) and `nginx.conf`. `REACT_APP_API_URL` must be passed as a build arg,
since CRA inlines env vars at build time, not at container runtime.
