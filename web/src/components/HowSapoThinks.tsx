export function HowSapoThinks() {
  const discarded = [
    { title: 'AI agent sends memecoin to reply guy', reason: 'low impact / viral noise' },
    { title: 'New smartphone leaked on Weibo', reason: 'out of scope / consumer tech' },
    { title: 'Local weather alert in Nebraska', reason: 'geographic noise' },
  ];

  const currentPost = {
    title: 'Global Semiconductor Supply Chain Update',
    reason: 'high impact, systemic relevance detected',
    fullTitle: '⚙️ Global Wire: Semiconductor Supply Chain faces new bottlenecks',
    sentiment: '🔵 Neutral',
    sentimentColor: '#4a9eff',
    category: '⚙️ Technology',
    source: 'TechFlow',
    body: 'Recent reports indicate a shift in the global semiconductor landscape. New manufacturing hubs are emerging, but logistics challenges remain the primary bottleneck for 2026 production cycles.',
    thought: 'The wire never sleeps. Infrastructure is the true signal. 🌐 🧠',
    tags: '#Hardware #SupplyChain #GlobalWire',
    image: '/post/example-post.png',
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '800px' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.2em',
          marginBottom: '8px',
        }}
      >
        // WIRE_INTELLIGENCE.exe
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px,3vw,32px)',
          fontWeight: 900,
          color: 'var(--text)',
          marginBottom: '16px',
        }}
      >
        How <span style={{ color: 'var(--green)' }}>TOAD-WIRE</span> Decides.
      </h2>

      {/* Pipeline: Log de decisiones */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }}
      >
        <div style={{ color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.8' }}>
          <div>
            📡 <span style={{ color: 'var(--text-dim)' }}>1024+ sources monitored</span>
          </div>
          <div>
            🔍 <span style={{ color: 'var(--text-dim)' }}>relevance filter: strict_mode</span>
          </div>
          <div>
            ⚡ <span style={{ color: 'var(--text-dim)' }}>signal_to_noise_ratio: 0.94</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {discarded.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '14px 1fr',
                gap: '8px',
                marginBottom: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ color: '#ff4444' }}>✗</span>
              <div>
                <span>"{item.title}"</span>
                <span style={{ color: '#555', display: 'block' }}>→ {item.reason}</span>
              </div>
            </div>
          ))}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '14px 1fr',
              gap: '8px',
              marginTop: '4px',
              color: 'var(--text)',
            }}
          >
            <span style={{ color: 'var(--green)' }}>✓</span>
            <div>
              <span>"{currentPost.title}"</span>
              <span style={{ color: 'var(--green)', display: 'block' }}>
                → {currentPost.reason}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Финальный пост */}
      <div
        style={{
          marginTop: '2px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            background: '#0a0a0a',
          }}
        >
          <img
            src={currentPost.image}
            alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
          />
          <div
            style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: currentPost.sentimentColor,
                background: 'rgba(0,0,0,0.8)',
                padding: '4px 8px',
              }}
            >
              {currentPost.sentiment}
            </span>
          </div>
        </div>

        <div style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <div
            style={{
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '12px',
              lineHeight: 1.4,
            }}
          >
            {currentPost.fullTitle}
          </div>
          <div
            style={{
              color: 'var(--text-dim)',
              lineHeight: 1.7,
              marginBottom: '12px',
              borderLeft: '2px solid var(--border)',
              paddingLeft: '12px',
            }}
          >
            {currentPost.body}
          </div>
          <div style={{ color: 'var(--green)', fontStyle: 'italic', marginBottom: '10px' }}>
            {currentPost.thought}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{currentPost.tags}</div>
        </div>
      </div>
    </section>
  );
}
