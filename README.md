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

Deploy `frontend/` to Vercel and set `VITE_API_URL` to the public backend URL. Deploy `backend/` to a Node host such as Render or Railway, then configure `GEMINI_API_KEY`, `PORT`, and an appropriate CORS policy for the production frontend. The current permissive CORS configuration is intended for this demo.

