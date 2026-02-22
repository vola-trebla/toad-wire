import { useEffect, useState } from 'react';

interface PriceMap {
    [symbol: string]: number;
}

export function useCryptoPrices(symbols: string[]) {
    const [prices, setPrices] = useState<PriceMap>({});

    useEffect(() => {
        const streams = symbols.map((s) => `${s.toLowerCase()}usdt@miniTicker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        const lastUpdate: { [symbol: string]: number } = {};

        ws.onmessage = (event) => {
            const { data } = JSON.parse(event.data);
            const now = Date.now();
            if (now - (lastUpdate[data.s] ?? 0) < 30000) return;
            lastUpdate[data.s] = now;
            setPrices((prev) => ({ ...prev, [data.s]: parseFloat(data.c) }));
        };

        return () => ws.close();
    }, []);

    return prices;
}
