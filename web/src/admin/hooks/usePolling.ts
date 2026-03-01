import { useEffect, useState } from 'react';
import { buildApiUrl } from '../../config';

interface PollingState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function usePolling<T>(path: string, intervalMs = 30000): PollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const adminToken = (import.meta.env.VITE_ADMIN_API_TOKEN as string | undefined)?.trim();

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    const load = async () => {
      try {
        setError(null);
        const url = buildApiUrl(path);
        const response = await fetch(url, {
          headers: adminToken ? { 'x-admin-token': adminToken } : undefined,
        });
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status} (${response.url})`);
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(
            `Non-JSON response from ${response.url}: ${text.slice(0, 120).trim() || 'empty'}`,
          );
        }
        const json = (await response.json()) as T;
        if (active) {
          setData(json);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    timer = window.setInterval(load, intervalMs);

    return () => {
      active = false;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [path, intervalMs]);

  return { data, error, loading };
}
