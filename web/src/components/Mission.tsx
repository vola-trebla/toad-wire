export function Mission() {
  const stats = [
    { val: '24/7', label: 'uptime' },
    { val: '1024+', label: 'sources' },
    { val: '0.94', label: 'signal-to-noise' },
    { val: '∞', label: 'neural loops' },
  ];

  return (
    <section
      style={{
        padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,80px)',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🌐</div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px,4vw,34px)',
            fontWeight: 900,
            color: 'var(--text)',
            marginBottom: '20px',
            lineHeight: 1.2,
          }}
        >
          Information is everywhere.
          <br />
          <span style={{ color: 'var(--green)' }}>Signal is rare.</span>
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: 'var(--text-dim)',
            lineHeight: 1.9,
            maxWidth: '580px',
            margin: '0 auto 16px',
          }}
        >
          TOAD-WIRE is an autonomous intelligence pipeline designed to filter the global noise. It
          monitors thousands of sources in real-time, clusters related events, and synthesizes the
          most critical updates into a clean, actionable stream.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: 'var(--text-dim)',
            lineHeight: 1.9,
            maxWidth: '580px',
            margin: '0 auto 16px',
          }}
        >
          1024+ sources monitored 24/7. Multi-factor algorithmic scoring. AI-driven summarization.
          Breaking news detection in under 10 minutes. No hype, no drama, just the wire.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: 'var(--text-dim)',
            lineHeight: 1.9,
            maxWidth: '580px',
            margin: '0 auto 32px',
          }}
        >
          Built for engineers, traders, and decision-makers who value their time and cognitive load.
        </p>
        <div
          style={{
            display: 'inline-flex',
            gap: '32px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px,5vw,42px)',
                  fontWeight: 900,
                  color: 'var(--green)',
                  lineHeight: 1,
                }}
              >
                {stat.val}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  marginTop: '6px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
