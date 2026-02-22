import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

type WsLike = {
    url: string;
    onmessage: ((ev: { data: string }) => void) | null;
    close: ReturnType<typeof vi.fn>;
};

let wsInstance: WsLike | null = null;

class MockWebSocket {
    url: string;
    onmessage: ((ev: { data: string }) => void) | null = null;
    close = vi.fn();

    constructor(url: string) {
        this.url = url;
        wsInstance = this;
    }
}

beforeEach(() => {
    wsInstance = null;
    vi.stubGlobal('WebSocket', MockWebSocket as any);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('useCryptoPrices', () => {
    it('opens a WebSocket connection on mount', () => {
        renderHook(() => useCryptoPrices(['BTC', 'ETH']));
        expect(wsInstance?.url).toContain('btcusdt@miniTicker');
        expect(wsInstance?.url).toContain('ethusdt@miniTicker');
    });

    it('closes WebSocket on unmount', () => {
        const { unmount } = renderHook(() => useCryptoPrices(['BTC']));
        unmount();
        expect(wsInstance?.close).toHaveBeenCalled();
    });

    it('updates prices when message is received', () => {
        const { result } = renderHook(() => useCryptoPrices(['BTC']));

        act(() => {
            wsInstance!.onmessage?.({
                data: JSON.stringify({ data: { s: 'BTCUSDT', c: '95000.00' } }),
            });
        });

        expect(result.current['BTCUSDT']).toBe(95000);
    });

    it('throttles updates per symbol', () => {
        const { result } = renderHook(() => useCryptoPrices(['BTC']));

        act(() => {
            wsInstance!.onmessage?.({
                data: JSON.stringify({ data: { s: 'BTCUSDT', c: '95000.00' } }),
            });
        });
        act(() => {
            wsInstance!.onmessage?.({
                data: JSON.stringify({ data: { s: 'BTCUSDT', c: '99999.00' } }),
            });
        });

        expect(result.current['BTCUSDT']).toBe(95000);
    });
});
