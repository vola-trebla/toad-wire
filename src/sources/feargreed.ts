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
    if (value <= 10) return `😱 *Sapo en Miedo Extremo* (${value})`;
    if (value <= 25) return `😨 *Sapo Asustado* (${value})`;
    if (value <= 45) return `🌫️ *Sapo Cauteloso* (${value})`;
    if (value <= 54) return `😐 *Sapo Neutral* (${value})`;
    if (value <= 74) return `🔥 *Sapo Codicioso* (${value})`;

    return `🤩🔥 *Sapo en Codicia Extrema* (${value})`;
}
