# Heatwave Intelligence Platform

A full-stack, real-time decision-support platform for monitoring regional heat, ingesting automated weather-station readings, projecting near-term conditions, validating forecasts, managing alerts, and generating stakeholder-specific advisories.

## Architecture

- `frontend/` — React, TypeScript, Vite, Tailwind CSS, Recharts
- `backend/` — Express and TypeScript API, validated AWS ingestion, SSE live stream, alert lifecycle, pluggable forecasting provider, repository/service separation, Gemini integration
- `shared/` — reusable domain types for future frontend/backend convergence

The checked-in dataset remains deterministic development data and must not be treated as official meteorological guidance. The operational API is ready to accept authenticated AWS observations, and its forecasting contract can be replaced by a Python TCN, LSTM, TFT, or external inference service without changing route handlers.

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
- `GET /api/operations/snapshot`
- `GET /api/forecast/:region?days=7`
- `GET /api/stations`
- `GET /api/alerts?status=active|acknowledged`
- `PATCH /api/alerts/:id/acknowledge`
- `POST /api/ingest/observations` with an optional `x-ingest-key`
- `GET /api/stream` (server-sent events)
- `POST /api/advisory` with `{ "region", "severity", "stakeholder" }`

### Observation ingestion

Set `INGEST_API_KEY` in production. Send each quality-checked AWS reading as JSON:

```json
{
  "station": "AWS-MUM-15",
  "location": "Mumbai",
  "region": "West Coast",
  "latitude": 19.076,
  "longitude": 72.8777,
  "maxTemperature": 36.8,
  "humidity": 68,
  "windSpeed": 4.2,
  "timestamp": "2026-09-09T10:00:00.000Z"
}
```

Accepted readings update the station repository, append an observation, emit a live event, and create an operational alert when the classified severity reaches heatwave level.

## Deployment

The project deploys as one Vercel application: the Vite frontend is served from `frontend/dist`, and the Express API runs as a serverless function under `/api`. This keeps browser/API traffic same-origin in production.

1. Import the repository into Vercel with the repository root as the project directory.
2. Optionally add `GEMINI_API_KEY` to enable AI-written advisories. Without it, the API returns reviewed, audience-specific fallback guidance.
3. Deploy. The included `vercel.json` supplies the build, routing, function, and security-header configuration.

For a CLI deployment, authenticate with `vercel login`, then run `vercel --prod` from the repository root.
