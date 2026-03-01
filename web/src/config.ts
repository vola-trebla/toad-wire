const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const fallbackBase = typeof window !== 'undefined' ? window.location.origin : '';

export const API_BASE_URL = envBase?.trim() || fallbackBase;

export function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
