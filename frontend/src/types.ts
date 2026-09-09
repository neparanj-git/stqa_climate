export type Region = 'North India' | 'Northwest India' | 'Central India' | 'East India' | 'Northeast India' | 'South Peninsula' | 'West Coast';
export type Severity = 'Normal' | 'Heat Alert' | 'Heatwave' | 'Severe Heatwave';
export interface Observation { timestamp:string; region:Region; season:string; latitude:number; longitude:number; maxTemperature:number; station:string; severity:Severity }
export interface Summary { region:Region; latestTemp:number; severity:Severity; normal:number; latitude:number; longitude:number; departure:number }
export interface Forecast { date:string; maxTemperature:number; severity:Severity; model:string }
export interface Station { station:string; location:string; region:Region; latestReading:number; humidity:number; windSpeed:number; regionalForecast:number; validation:'consistent'|'watch'|'divergent'; quality:'good'|'delayed'|'suspect'; provider:string; timestamp:string }
export interface Alert { id:string; region:Region; severity:Severity; title:string; message:string; createdAt:string; status:'active'|'acknowledged'; acknowledgedAt?:string }
export interface Snapshot { generatedAt:string; connection:'live'; forecastProvider:string; regions:Summary[]; hottest:Summary; activeAlerts:number; reportingStations:number; totalStations:number; dataQuality:number; stations:Station[]; alertList:Alert[] }
export const regions: Region[] = ['North India','Northwest India','Central India','East India','Northeast India','South Peninsula','West Coast'];
