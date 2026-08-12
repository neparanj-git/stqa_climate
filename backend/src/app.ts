import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { REGIONS, type Region } from './domain.js';
import { climateRepository } from './repository.js';
import { latestByRegion, regionMeta } from './data.js';
import { classifySeverity } from './severity.js';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map(x => x.trim()) ?? true, methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json({ limit: '16kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'heatwave-api', timestamp: new Date().toISOString() }));
app.get('/api/observations', (req, res) => {
  const { region, season, from, to } = req.query;
  if (region && (!isString(region) || !REGIONS.includes(region as Region))) return res.status(400).json({ error: 'Invalid region' });
  if (season && (!isString(season) || !['Winter','Pre-Monsoon/Summer','Monsoon','Post-Monsoon'].includes(season))) return res.status(400).json({ error: 'Invalid season' });
  if ((from && !validDate(from)) || (to && !validDate(to))) return res.status(400).json({ error: 'Dates must use YYYY-MM-DD format' });
  res.json(climateRepository.findObservations({ region: region as never, season: season as never, from: from as string, to: to as string }));
});
app.get('/api/regions/summary', (_req, res) => res.json(REGIONS.map(region => { const o = latestByRegion(region); return { region, latestTemp: o.maxTemperature, severity: o.severity, normal: regionMeta[region].normal, latitude: o.latitude, longitude: o.longitude }; })));
app.get('/api/forecast/:region', (req, res) => {
  const region = decodeURIComponent(req.params.region) as Region;
  if (!REGIONS.includes(region)) return res.status(404).json({ error: 'Unknown region' });
  const latest = latestByRegion(region); const history = climateRepository.findObservations({ region }).slice(-7);
  const trend = (history.at(-1)!.maxTemperature - history[0].maxTemperature) / 6;
  // Placeholder trend extrapolation; replace this service with an ML forecast provider.
  res.json(Array.from({ length: 5 }, (_, i) => { const date = new Date(latest.timestamp); date.setUTCDate(date.getUTCDate() + i + 1); const temp = Number((latest.maxTemperature + trend * (i + 1) + Math.sin(i) * .5).toFixed(1)); return { date: date.toISOString(), maxTemperature: temp, severity: classifySeverity(temp, regionMeta[region].normal) }; }));
});
app.get('/api/stations', (_req, res) => res.json(climateRepository.getStations()));
app.post('/api/advisory', async (req, res) => {
  const { region, severity, stakeholder } = req.body ?? {};
  const severities = ['Normal', 'Heat Alert', 'Heatwave', 'Severe Heatwave'];
  const stakeholders = ['citizens', 'farmers', 'health agencies', 'local authorities'];
  if (!REGIONS.includes(region) || !severities.includes(severity) || !stakeholders.includes(stakeholder)) return res.status(400).json({ error: 'Choose a valid region, severity and audience' });
  if (!process.env.GEMINI_API_KEY) return res.json({ advisory: fallbackAdvisory(region, severity, stakeholder), source: 'curated' });
  try {
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Write a 2–4 sentence heat advisory for ${stakeholder} in ${region}. Current classification: ${severity}. Use plain, factual language, avoid alarmism, and include at least one concrete recommended action. Do not invent forecasts or statistics.`;
    const result = await model.generateContent(prompt); res.json({ advisory: result.response.text(), source: 'ai' });
  } catch { res.json({ advisory: fallbackAdvisory(region, severity, stakeholder), source: 'curated' }); }
});

app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error); res.status(500).json({ error: 'An unexpected server error occurred' });
});

const isString = (value: unknown): value is string => typeof value === 'string';
const validDate = (value: unknown) => isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
function fallbackAdvisory(region:string, severity:string, stakeholder:string) {
  const actions:Record<string,string> = {
    citizens: 'Limit strenuous outdoor activity during the hottest hours, drink water regularly, and check on older neighbours and children.',
    farmers: 'Shift field work to cooler morning hours, provide shaded drinking water for workers and livestock, and monitor crops for heat stress.',
    'health agencies': 'Review heat-illness readiness, ensure hydration supplies are available, and prioritize outreach to high-risk communities.',
    'local authorities': 'Activate public cooling and drinking-water points, brief field teams, and share verified heat-safety guidance through local channels.'
  };
  return `${region} is currently classified as ${severity}. ${actions[stakeholder]}`;
}

export default app;
