import type { Region } from './domain.ts';

/** Domain configuration only. Runtime weather values are supplied by live providers. */
export const regionMeta: Record<Region, { normal: number; lat: number; lon: number }> = {
  'North India': { normal: 37, lat: 30.7, lon: 78.2 },
  'Northwest India': { normal: 39, lat: 27.2, lon: 73.8 },
  'Central India': { normal: 38, lat: 22.8, lon: 78.7 },
  'East India': { normal: 36, lat: 23.1, lon: 86.7 },
  'Northeast India': { normal: 31, lat: 26.2, lon: 92.9 },
  'South Peninsula': { normal: 35, lat: 13.1, lon: 78.7 },
  'West Coast': { normal: 33, lat: 16.3, lon: 74.3 }
};

export const stationRegistry: Array<{ station:string; location:string; region:Region; latitude:number; longitude:number }> = [
  {station:'AWS-DEL-01',location:'New Delhi',region:'North India',latitude:28.61,longitude:77.21},{station:'AWS-SGR-02',location:'Srinagar',region:'North India',latitude:34.08,longitude:74.80},
  {station:'AWS-JAI-03',location:'Jaipur',region:'Northwest India',latitude:26.91,longitude:75.79},{station:'AWS-JSL-04',location:'Jaisalmer',region:'Northwest India',latitude:26.92,longitude:70.91},
  {station:'AWS-BPL-05',location:'Bhopal',region:'Central India',latitude:23.26,longitude:77.41},{station:'AWS-NGP-06',location:'Nagpur',region:'Central India',latitude:21.15,longitude:79.09},
  {station:'AWS-PAT-07',location:'Patna',region:'East India',latitude:25.59,longitude:85.14},{station:'AWS-KOL-08',location:'Kolkata',region:'East India',latitude:22.57,longitude:88.36},
  {station:'AWS-GHY-09',location:'Guwahati',region:'Northeast India',latitude:26.14,longitude:91.74},{station:'AWS-SHG-10',location:'Shillong',region:'Northeast India',latitude:25.58,longitude:91.89},
  {station:'AWS-HYD-11',location:'Hyderabad',region:'South Peninsula',latitude:17.39,longitude:78.49},{station:'AWS-BLR-12',location:'Bengaluru',region:'South Peninsula',latitude:12.97,longitude:77.59},
  {station:'AWS-GOA-13',location:'Panaji',region:'West Coast',latitude:15.49,longitude:73.83},{station:'AWS-KOC-14',location:'Kochi',region:'West Coast',latitude:9.93,longitude:76.27}
];
