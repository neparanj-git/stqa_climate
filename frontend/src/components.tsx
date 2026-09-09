import type { ReactNode } from 'react';
import { RadioTower } from 'lucide-react';
import type { Severity } from './types';
export const severityColors:Record<Severity,string>={Normal:'#20a178','Heat Alert':'#eda820',Heatwave:'#ef6a24','Severe Heatwave':'#cf2f2f'};
export function PageHead({title,copy,action}:{title:string;copy:string;action?:ReactNode}){return <div className="page-head"><div><h1>{title}</h1><p>{copy}</p></div>{action}</div>}
export function Badge({severity}:{severity:Severity}){return <span className="severity-badge" style={{color:severityColors[severity],background:`${severityColors[severity]}13`}}><i style={{background:severityColors[severity]}}/>{severity}</span>}
export function Loading(){return <div className="loading"><span/>Loading climate data…</div>}
export function ErrorBox({message}:{message:string}){return <div className="error-box">{message}</div>}
export function EmptyState({title,copy}:{title:string;copy:string}){return <div className="empty-state"><RadioTower/><strong>{title}</strong><p>{copy}</p></div>}
