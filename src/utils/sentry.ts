import * as Sentry from '@sentry/node';
import { config } from '../config.js';

export function initSentry(): void {
  if (!config.SENTRY_DSN) return;

  Sentry.init({
    dsn: config.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
