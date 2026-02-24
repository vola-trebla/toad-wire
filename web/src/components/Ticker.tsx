import { memo } from 'react';

const TICKER_ITEMS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'AVAX', 'DOT', 'LINK', 'UNI'];

interface Props {
  prices: { [symbol: string]: number };
  color: string;
}

export const Ticker = memo(({ prices, color }: Props) => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      style={{
        background: '#050f05',
        borderBottom: '1px solid rgba(45,255,110,0.15)',
        overflow: 'hidden',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          animation: 'ticker 20s linear infinite',
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color,
              padding: '0 24px',
              opacity: 0.7,
              letterSpacing: '0.25em',
              cursor: 'default',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.opacity = '1';
              el.style.textShadow = `0 0 12px ${color}`;
              el.style.transform = 'scale(1.15)';
              el.style.letterSpacing = '0.35em';
              // pause ticker animation
              const ticker = el.parentElement as HTMLElement;
              ticker.style.animationPlayState = 'paused';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.opacity = '0.7';
              el.style.textShadow = 'none';
              el.style.transform = 'scale(1)';
              el.style.letterSpacing = '0.25em';
              const ticker = el.parentElement as HTMLElement;
              ticker.style.animationPlayState = 'running';
            }}
          >
            {item} {prices[`${item}USDT`] ? `$${prices[`${item}USDT`].toLocaleString()}` : '...'}{' '}
            <span style={{ opacity: 0.4 }}>///</span>
          </span>
        ))}
      </div>
    </div>
  );
});
