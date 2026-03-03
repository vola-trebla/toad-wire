import { logger } from '../utils/logger.js';

export interface FearGreedData {
  value: number;
  classification: string;
}

export async function fetchFearGreed(): Promise<FearGreedData | null> {
  return fetch('https://api.alternative.me/fng/')
    .then(
      (res) =>
        res.json() as Promise<{
          data: Array<{ value: string; value_classification: string }>;
        }>,
    )
    .then((json) => ({
      value: parseInt(json.data[0]!.value),
      classification: json.data[0]!.value_classification,
    }))
    .catch((error) => {
      logger.error({ err: error }, '❌ Failed to fetch Fear & Greed');
      return null;
    });
}

export function formatFearGreed(value: number): string {
  if (value <= 10) return `Pánico en el Sistema (${value}) 🚨`;
  if (value <= 25) return `Alerta de Miedo (${value}) 😨`;
  if (value <= 45) return `️ Incertidumbre en Red (${value}) 🌫`;
  if (value <= 54) return `Neutro / Calibrando (${value}) ⚖️`;
  if (value <= 74) return `Codicia Detectada (${value}) ⚡`;

  return `🔥 Euforia Crítica (${value})`;
}
