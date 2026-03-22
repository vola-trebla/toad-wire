interface Props {
  color: string;
}

const SYSTEM_EVENTS = [
  'INITIALIZING_CORE_ENGINE...',
  'CONNECTING_TO_GLOBAL_WIRE...',
  'FETCHING_RSS_FEEDS_SYNCED',
  'ANALYZING_SENTIMENT_VECTOR_0.98',
  'STORY_CLUSTERING_COMPLETE',
  'FILTERING_NOISE_RELEVANCE_STRICT',
  'BROADCASTING_SIGNAL_TO_X_API',
  'TELEGRAM_CHANNEL_STATUS_ONLINE',
  'DATABASE_INTEGRITY_VERIFIED',
  'MEMORY_OPTIMIZATION_RUNNING',
  'API_LATENCY_34MS_STABLE',
  'INCOMING_DATA_STREAM_HEALTH_100%',
];

export function Ticker({ color }: Props) {
  return (
    <div
      style={{
        background: '#000',
        height: '32px',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'ticker 40s linear infinite',
        }}
      >
        {[...SYSTEM_EVENTS, ...SYSTEM_EVENTS].map((event, i) => (
          <div
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 40px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color,
              letterSpacing: '0.1em',
              fontWeight: 700,
            }}
          >
            <span style={{ opacity: 0.5, marginRight: '10px' }}>[SYSTEM]</span>
            {event}
          </div>
        ))}
      </div>
    </div>
  );
}
