const base = import.meta.env.VITE_API_URL ?? '';
export async function api<T>(path:string, init?:RequestInit):Promise<T> { const response = await fetch(`${base}${path}`, init); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? 'Request failed'); return body; }

