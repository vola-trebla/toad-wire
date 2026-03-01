const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const fallbackBase = typeof window !== 'undefined' ? window.location.origin : '';

function normalizeBase(base: string): string {
  if (!base) return '';
  if (base.startsWith('http://') || base.startsWith('https://') || base.startsWith('/')) {
    return base;
  }
  return `https://${base}`;
}

export const API_BASE_URL = normalizeBase(envBase || fallbackBase);

export function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
