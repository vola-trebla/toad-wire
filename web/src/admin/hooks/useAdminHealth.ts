import { usePolling } from './usePolling';
import type { HealthResponse } from '../types';

export function useAdminHealth(intervalMs = 30000) {
  return usePolling<HealthResponse>('/health', intervalMs);
}
