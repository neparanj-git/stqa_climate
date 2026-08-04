import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { REGIONS, type Region } from './domain.js';
import { climateRepository } from './repository.js';
import { latestByRegion, regionMeta } from './data.js';
import { classifySeverity } from './severity.js';

export const app = express();
app.use(cors()); app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/observations', (req, res) => res.json(climateRepository.findObservations(req.query as never)));
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
  if (!region || !severity || !stakeholder) return res.status(400).json({ error: 'region, severity and stakeholder are required' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Advisory generation is unavailable. Configure GEMINI_API_KEY on the server.' });
  try {
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Write a 2–4 sentence heat advisory for ${stakeholder} in ${region}. Current classification: ${severity}. Use plain, factual language, avoid alarmism, and include at least one concrete recommended action. Do not invent forecasts or statistics.`;
    const result = await model.generateContent(prompt); res.json({ advisory: result.response.text() });
  } catch { res.status(502).json({ error: 'The advisory service could not generate a response. Please try again.' }); }
});

