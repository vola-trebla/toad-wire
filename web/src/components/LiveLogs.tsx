import { useState, useEffect } from 'react';

const LOGS = [
  '[SYS] Initializing TOAD-WIRE v2.4.0...',
  '[NET] Connecting to global news nodes...',
  '[RSS] Fetching 1024 sources: 100% complete',
  '[AI] Loading summarization model: Flash-2.0',
  '[DB] Database integrity verified: OK',
  '[SYS] Engine status: NOMINAL',
  '[PROC] Clustering stories from last 60m...',
  '[SIG] New signal detected: tech_bottleneck',
  '[LLM] Ranked relevance: 0.94/1.0',
  '[OUT] Dispatching to X/Telegram channels...',
  '[MET] API Latency: 32ms | Memory: 1.2GB',
  '[SYS] Standing by for new data packets...',
];

export function LiveLogs() {
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLogs((prev) => {
        const next = [...prev, LOGS[index]];
        if (next.length > 5) next.shift();
        return next;
      });
      setIndex((prev) => (prev + 1) % LOGS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [index]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '320px',
        background: 'rgba(5, 15, 5, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        padding: '12px',
        zIndex: 200,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--text-muted)',
          letterSpacing: '0.2em',
          marginBottom: '6px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>LIVE_SYSTEM_LOGS</span>
        <span style={{ color: 'var(--green)', animation: 'pulse 1s infinite' }}>● RUNNING</span>
      </div>
      {currentLogs.map((log, i) => (
        <div
          key={i}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: log.includes('[SYS]') ? 'var(--green)' : 'var(--text-dim)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: (i + 1) / currentLogs.length,
          }}
        >
          {log}
        </div>
      ))}
    </div>
  );
}
