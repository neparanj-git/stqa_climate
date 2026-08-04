export type Region = 'North India' | 'Northwest India' | 'Central India' | 'East India' | 'Northeast India' | 'South Peninsula' | 'West Coast';
export type Severity = 'Normal' | 'Heat Alert' | 'Heatwave' | 'Severe Heatwave';
export interface Observation { timestamp:string; region:Region; season:string; latitude:number; longitude:number; maxTemperature:number; station:string; severity:Severity }
export interface Summary { region:Region; latestTemp:number; severity:Severity; normal:number; latitude:number; longitude:number }
export interface Forecast { date:string; maxTemperature:number; severity:Severity }
export interface Station { station:string; location:string; region:Region; latestReading:number; regionalForecast:number; validation:'consistent'|'watch'|'divergent'; timestamp:string }
export const regions: Region[] = ['North India','Northwest India','Central India','East India','Northeast India','South Peninsula','West Coast'];

