# Heatwave Intelligence Platform

A full-stack decision-support demo for monitoring regional heat, projecting near-term conditions, validating forecasts with simulated automated weather stations, and generating stakeholder-specific advisories.

## Architecture

- `frontend/` — React, TypeScript, Vite, Tailwind CSS, Recharts
- `backend/` — Express and TypeScript API, repository/service separation, Gemini integration
- `shared/` — reusable domain types for future frontend/backend convergence

The data is deterministic simulated climate data. Forecasts use a deliberately simple trend extrapolation and must not be treated as official meteorological guidance.

## Local setup

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example backend/.env
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:4000`.

To enable advisory generation, set `GEMINI_API_KEY` in `backend/.env`. Never commit that file. The rest of the application works without an API key and displays a clear service-unavailable message for advisory requests.

## Commands

```bash
npm run dev     # frontend and backend together
npm run build   # production builds
npm test        # backend classification tests
```

## API

- `GET /api/observations?region=&season=&from=&to=`
- `GET /api/regions/summary`
- `GET /api/forecast/:region`
- `GET /api/stations`
- `POST /api/advisory` with `{ "region", "severity", "stakeholder" }`

## Deployment

The project deploys as one Vercel application: the Vite frontend is served from `frontend/dist`, and the Express API runs as a serverless function under `/api`. This keeps browser/API traffic same-origin in production.

1. Import the repository into Vercel with the repository root as the project directory.
2. Optionally add `GEMINI_API_KEY` to enable AI-written advisories. Without it, the API returns reviewed, audience-specific fallback guidance.
3. Deploy. The included `vercel.json` supplies the build, routing, function, and security-header configuration.

For a CLI deployment, authenticate with `vercel login`, then run `vercel --prod` from the repository root.
