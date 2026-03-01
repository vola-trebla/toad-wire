export function HowSapoThinks() {
  const discarded = [
    { title: 'AI agent sends memecoin to reply guy', reason: 'viral pero bajo impacto real' },
    { title: 'Blockchain apps failed the masses', reason: 'opinión, no noticia de mercado' },
    { title: 'Bitdeer dumps entire BTC reserves', reason: 'relevante pero menor escala' },
  ];

  // Единый объект данных для выбранного кейса
  const currentPost = {
    title: 'Arbitrum bajo presión: Ballenas venden ARB',
    reason: 'alto impacto, volumen on-chain detectado',
    fullTitle: '📉 Arbitrum bajo presión: Ballenas venden ARB y avivan temor a mínimos históricos',
    sentiment: '🔴 Bearish',
    sentimentColor: '#ff4444',
    category: '📈 Trading',
    source: 'BeInCrypto',
    body: 'Según BeInCrypto, el precio de Arbitrum (ARB) enfrenta una fuerte presión vendedora. En las últimas tres semanas, las ballenas han liquidado más de 60 millones de ARB, inyectando una oferta considerable en el mercado.',
    thought: 'Cuando las ballenas hacen olas, el mercado siente el mareo. Clásico. 🌐 🧠',
    tags: '#Arbitrum #Cripto #Mercado',
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
        // HOW_SAPO_THINKS.exe
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
        Así elige <span style={{ color: 'var(--green)' }}>El Sapo.</span>
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
            📡 <span style={{ color: 'var(--text-dim)' }}>320+ artículos analizados</span>
          </div>
          <div>
            🔍 <span style={{ color: 'var(--text-dim)' }}>filtro de relevancia activado</span>
          </div>
          <div>
            ⚡ <span style={{ color: 'var(--text-dim)' }}>Breaking news detectado</span>
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
