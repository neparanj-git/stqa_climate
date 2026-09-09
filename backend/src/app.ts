import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { REGIONS, type IngestReading, type Region } from './domain.ts';
import { climateRepository } from './repository.ts';
import { forecastProvider } from './forecast.ts';
import { acknowledgeAlert, createAlert, listAlerts, operationalSnapshot } from './operations.ts';
import { climateEvents, type ClimateEvent } from './events.ts';
import { liveStations } from './weather.ts';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map(x => x.trim()) ?? true, methods: ['GET', 'POST', 'PATCH', 'OPTIONS'] }));
app.use(express.json({ limit: '32kb' }));
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('Cache-Control', 'no-store'); next(); });

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'heatwave-api', version: '2.0.0', forecastProvider: forecastProvider.name, timestamp: new Date().toISOString() }));
app.get('/api/catalog', (_req,res)=>res.json({regions:REGIONS,severities:['Normal','Heat Alert','Heatwave','Severe Heatwave'],stakeholders:['citizens','farmers','health agencies','local authorities']}));
app.get('/api/operations/snapshot', async (_req,res,next) => { try { res.json(await operationalSnapshot()); } catch(error){ next(error); } });
app.get('/api/observations', (req, res) => {
  const { region, season, from, to } = req.query;
  if (region && (!isString(region) || !REGIONS.includes(region as Region))) return res.status(400).json({ error: 'Invalid region' });
  if (season && (!isString(season) || !['Winter','Pre-Monsoon/Summer','Monsoon','Post-Monsoon'].includes(season))) return res.status(400).json({ error: 'Invalid season' });
  if ((from && !validDate(from)) || (to && !validDate(to))) return res.status(400).json({ error: 'Dates must use YYYY-MM-DD format' });
  res.json(climateRepository.findObservations({ region: region as never, season: season as never, from: from as string, to: to as string }));
});
app.get('/api/regions/summary', async (_req,res,next) => { try { res.json((await operationalSnapshot()).regions); } catch(error){ next(error); } });
app.get('/api/forecast/:region', async (req, res, next) => {
  try { const region = decodeURIComponent(req.params.region) as Region; if (!REGIONS.includes(region)) return res.status(404).json({ error: 'Unknown region' }); const days = Math.min(10, Math.max(1, Number(req.query.days) || 7)); res.json(await forecastProvider.forecast(region, days)); } catch (error) { next(error); }
});
app.get('/api/stations', async (_req,res,next) => { try { res.json(await liveStations()); } catch(error){ next(error); } });
app.get('/api/alerts', async (req,res,next) => { try { const status=req.query.status;if(status&&status!=='active'&&status!=='acknowledged')return res.status(400).json({error:'Invalid alert status'});res.json(await listAlerts(status as never)); } catch(error){ next(error); } });
app.patch('/api/alerts/:id/acknowledge', async (req,res,next) => { try { const alert=await acknowledgeAlert(req.params.id);if(!alert)return res.status(404).json({error:'Alert not found'});climateEvents.publish('alert-updated',alert);res.json(alert); } catch(error){ next(error); } });

app.post('/api/ingest/observations', (req, res) => {
  if (process.env.INGEST_API_KEY && req.header('x-ingest-key') !== process.env.INGEST_API_KEY) return res.status(401).json({ error: 'Invalid ingestion credentials' });
  const validation = validateReading(req.body); if (validation) return res.status(400).json({ error: validation });
  const result = climateRepository.ingest(req.body as IngestReading); const event = climateEvents.publish('observation', result);
  if (result.observation.severity === 'Heatwave' || result.observation.severity === 'Severe Heatwave') climateEvents.publish('alert', createAlert(result.observation.region, result.observation.severity, result.observation.maxTemperature));
  res.status(202).json({ accepted: true, eventId: event.emittedAt, ...result });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Connection', 'keep-alive'); res.setHeader('Cache-Control', 'no-cache, no-transform'); res.flushHeaders();
  res.write(`event: ready\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  const send = (event: ClimateEvent) => res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`); climateEvents.on('climate-event', send);
  const heartbeat = setInterval(() => res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`), 20_000);
  req.on('close', () => { clearInterval(heartbeat); climateEvents.off('climate-event', send); });
});

app.post('/api/advisory', async (req, res) => {
  const { region, severity, stakeholder } = req.body ?? {}; const severities = ['Normal', 'Heat Alert', 'Heatwave', 'Severe Heatwave']; const stakeholders = ['citizens', 'farmers', 'health agencies', 'local authorities'];
  if (!REGIONS.includes(region) || !severities.includes(severity) || !stakeholders.includes(stakeholder)) return res.status(400).json({ error: 'Choose a valid region, severity and audience' });
  if (!process.env.GEMINI_API_KEY) return res.json({ advisory: fallbackAdvisory(region, severity, stakeholder), source: 'curated' });
  try { const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-1.5-flash' }); const prompt = `Write a 2–4 sentence heat advisory for ${stakeholder} in ${region}. Current classification: ${severity}. Use plain, factual language, avoid alarmism, and include at least one concrete recommended action. Do not invent forecasts or statistics.`; const result = await model.generateContent(prompt); res.json({ advisory: result.response.text(), source: 'ai' }); }
  catch { res.json({ advisory: fallbackAdvisory(region, severity, stakeholder), source: 'curated' }); }
});

app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error); res.status(500).json({ error: 'An unexpected server error occurred' }); });

const isString = (value: unknown): value is string => typeof value === 'string';
const validDate = (value: unknown) => isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
function validateReading(value: Partial<IngestReading>) { if (!value || !isString(value.station) || !isString(value.location) || !REGIONS.includes(value.region as Region)) return 'Station, location and a valid region are required'; if (![value.latitude,value.longitude,value.maxTemperature,value.humidity,value.windSpeed].every(Number.isFinite)) return 'Coordinates and weather measurements must be numbers'; if (!isString(value.timestamp) || Number.isNaN(Date.parse(value.timestamp))) return 'A valid ISO timestamp is required'; if (value.maxTemperature! < -30 || value.maxTemperature! > 65 || value.humidity! < 0 || value.humidity! > 100 || value.windSpeed! < 0) return 'Reading is outside accepted physical limits'; }
function fallbackAdvisory(region:string, severity:string, stakeholder:string) { const actions:Record<string,string> = { citizens: 'Limit strenuous outdoor activity during the hottest hours, drink water regularly, and check on older neighbours and children.', farmers: 'Shift field work to cooler morning hours, provide shaded drinking water for workers and livestock, and monitor crops for heat stress.', 'health agencies': 'Review heat-illness readiness, ensure hydration supplies are available, and prioritize outreach to high-risk communities.', 'local authorities': 'Activate public cooling and drinking-water points, brief field teams, and share verified heat-safety guidance through local channels.' }; return `${region} is currently classified as ${severity}. ${actions[stakeholder]}`; }
export default app;
