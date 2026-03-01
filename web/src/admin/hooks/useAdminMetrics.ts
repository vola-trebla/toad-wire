import { usePolling } from './usePolling';
import type { MetricsResponse } from '../types';

export function useAdminMetrics(intervalMs = 60000) {
  return usePolling<MetricsResponse>('/metrics', intervalMs);
}
