# Heatwave Intelligence Platform

A full-stack, real-time decision-support platform for monitoring regional heat, ingesting automated weather-station readings, projecting near-term conditions, validating forecasts, managing alerts, and generating stakeholder-specific advisories.

## Architecture

- `frontend/` — React, TypeScript, Vite, Tailwind CSS, Recharts
- `backend/` — Express and TypeScript API, validated AWS ingestion, SSE live stream, alert lifecycle, pluggable forecasting provider, repository/service separation, Gemini integration
- `shared/` — reusable domain types for future frontend/backend convergence

Runtime temperatures, humidity, wind and daily forecasts come from the configured weather-provider adapter. The default development provider is Open-Meteo; it can be replaced with IMD/AWS infrastructure without changing route handlers or frontend components. The forecasting contract is also ready for a Python TCN, LSTM, TFT, or external inference service.

Region coordinates, station locations and heat-classification thresholds are domain configuration. They are never used to fabricate measurements. When the weather provider is unavailable, the API returns an error instead of displaying generated fallback weather.

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
- `GET /api/catalog`
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

Accepted readings update the ingestion repository, append an observation, emit a live event, and create an operational alert when the classified severity reaches heatwave level.

The `WX-*` reference points shown before physical AWS integration are explicitly labelled with their provider in the interface. Only observations submitted through the ingestion endpoint are labelled `AWS ingestion`.

### Runtime configuration

- `WEATHER_API_URL` selects the live weather provider endpoint.
- `WEATHER_CACHE_SECONDS` controls provider response caching.
- `INGEST_API_KEY` protects AWS ingestion in production.
- `GEMINI_API_KEY` optionally enables generated advisories.

## Deployment

The project deploys as one Vercel application: the Vite frontend is served from `frontend/dist`, and the Express API runs as a serverless function under `/api`. This keeps browser/API traffic same-origin in production.

1. Import the repository into Vercel with the repository root as the project directory.
2. Optionally add `GEMINI_API_KEY` to enable AI-written advisories. Without it, the API returns reviewed, audience-specific fallback guidance.
3. Deploy. The included `vercel.json` supplies the build, routing, function, and security-header configuration.

For a CLI deployment, authenticate with `vercel login`, then run `vercel --prod` from the repository root.
