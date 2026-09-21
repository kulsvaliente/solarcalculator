# AREC‑GIS Frontend (React + MUI)

A production‑ready frontend for the Affiliated Renewable Energy Center (AREC) Geographic Information System. It powers the public experience and the authenticated dashboard (inventories, requests/transfers, renergies, blogs, users), with maps, tables, and charts.

## Highlights

- React 18, React Router v6
- MUI 5 (Material UI) with custom theme (Poppins), CssBaseline
- Redux Toolkit + RTK Query for data fetching/cache
- Leaflet + react‑leaflet for maps, MUI X DataGrid/Charts for tables and charts
- Robust error boundaries, unified loaders, and accessibility baked in

## Quick start

Prerequisites
- Node 18+ and npm 9+

Install and run (development)
```bash
npm install
npm start
```
App runs on http://localhost:3000

Build (production)
```bash
npm run build
```
The optimized build is generated under `build/`.

Run with Docker (optional)
```bash
docker build -t arec-frontend .
docker run -p 8080:80 arec-frontend
# open http://localhost:8080
```

## Configuration

Environment variables
- `REACT_APP_OWM_KEY` (optional) – OpenWeatherMap API key for weather overlays in map views.

API base URL
- Configured in `src/config/baseUrl.js`. Update it to point at your backend (Express) service.

Fonts
- Poppins is loaded in `public/index.html`.

Tile performance
- Preconnects for OSM and ArcGIS tile servers are added in `public/index.html`.

## Project structure

```
src/
  app/                # Redux store
  components/         # Shared UI (layouts, error boundaries, loaders, dialogs)
  config/             # Appbar, theme helpers, constants
  features/           # Domain features (auth, inventories, renergies, blogs, requests, users, charts)
  hooks/              # Custom hooks
  lib/                # Monitoring hooks (reportError)
  index.js, App.js    # Entrypoints and routing
```

Key files
- `src/App.js`: Routes, theme, Suspense fallback (GlobalLoading), 404/403 routes
- `src/components/ErrorBoundary.js`: Global error UI and reporting
- `src/components/FeatureErrorBoundary.js`: Per‑feature error containment
- `src/components/GlobalLoading.js` / `src/components/SectionLoading.js`: Unified loaders
- `src/features/auth/RequireAuth.js`: Role‑gated routes
- `src/components/PublicDashLayout.js` / `src/components/DashLayout.js`: Public/admin layouts

## UI/UX standards (what’s enforced)

Loading
- Route‑level Suspense fallback with branded Backdrop
- Section‑level loaders for lists/forms/maps

Errors
- Global error boundary with retry/report actions
- Feature error boundary for localized failures
- Friendly 404 NotFound and 403 Forbidden pages with contextual CTAs (Go Home, Go to Dashboard/Login)

Accessibility (AA targets)
- Skip‑to‑content link and `<main id="main-content">` landmarks
- Focus visible on custom controls; 44×44 touch targets for map buttons
- Specific `aria-label`s for custom buttons and `aria-live` for async errors
- DataGrid: accessible labels and `noRowsOverlay`
- Respects `prefers-reduced-motion` for map flyTo animations

Theming
- MUI theme with proper `palette.primary/secondary` keys, Poppins typography via `public/index.html`
- Global `CssBaseline` in `App.js`

Maps
- Leaflet layers with optional OWM overlays (requires `REACT_APP_OWM_KEY`)
- Preconnects for tile servers

## Scripts

```json
{
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test"
}
```

## Development notes

- Routing
  - Public routes under `/public/*`
  - Authenticated routes under `/dashboard/*`
  - Role guard: `RequireAuth`
  - Persistent session: `PersistLogin`

- Data
  - RTK Query slices per feature (e.g., `inventoriesApiSlice`, `requestsApiSlice`)
  - Server‑side pagination in large tables (DataGrid) with loading and error states

- Error monitoring
  - Wire `lib/monitoring.reportError()` to your error backend (e.g., Sentry) in production

## Deployment

As static assets served by NGINX
- Use the provided `Dockerfile` and `nginx.conf` (in this folder) for production container image.

Behind another web server
- Ensure single‑page application fallback to `index.html` for client‑side routing.

## Troubleshooting

- “Cannot read properties of undefined (reading 'main')”
  - Ensure MUI Button `color` is a valid palette key (`primary`, `secondary`, `inherit`, etc.).
  - This codebase uses only valid palette keys; custom colors should be applied via `sx`.

- Map tiles don’t load
  - Check network access to OSM/ArcGIS hosts; OWM overlays require `REACT_APP_OWM_KEY`.

## License

Internal/Project use. Update this section with your organization’s license policy as needed.

