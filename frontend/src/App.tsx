import { NavLink, Route, Routes } from 'react-router-dom';
import { Activity, BellRing, CloudSun, Info, Menu, RadioTower, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Dashboard, Watch, Stations, Advisories, About } from './pages';

const nav = [{to:'/',label:'Dashboard',icon:Activity},{to:'/watch',label:'Heatwave Watch',icon:BellRing},{to:'/stations',label:'AWS Stations',icon:RadioTower},{to:'/advisories',label:'Advisories',icon:Sparkles},{to:'/about',label:'About',icon:Info}];
export default function App(){ const [open,setOpen]=useState(false); return <div className="min-h-screen lg:flex">
  <header className="flex items-center justify-between bg-ink p-4 text-white lg:hidden"><Brand/><button aria-label="Toggle menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></header>
  <aside className={`${open?'block':'hidden'} fixed inset-y-0 left-0 z-20 w-64 bg-ink px-5 py-7 text-white lg:sticky lg:block lg:h-screen`}><Brand/><p className="mt-3 text-xs leading-5 text-teal-100/60">Climate operations console</p><nav className="mt-10 space-y-2">{nav.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive?'bg-teal-500/20 text-white':'text-teal-50/65 hover:bg-white/5 hover:text-white'}`}><Icon size={18}/>{label}</NavLink>)}</nav><div className="absolute bottom-7 left-5 right-5 rounded-xl border border-teal-300/15 bg-white/5 p-3 text-xs text-teal-50/60"><span className="mb-2 block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"/>Simulated feeds operational</div></aside>
  <main className="min-w-0 flex-1 p-4 md:p-8 lg:p-10"><Routes><Route path="/" element={<Dashboard/>}/><Route path="/watch" element={<Watch/>}/><Route path="/stations" element={<Stations/>}/><Route path="/advisories" element={<Advisories/>}/><Route path="/about" element={<About/>}/></Routes></main>
 </div> }
function Brand(){return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-400/15 text-teal-300"><CloudSun/></span><div><p className="font-bold leading-tight">Heatwave</p><p className="text-xs font-semibold tracking-widest text-teal-300">INTELLIGENCE</p></div></div>}

