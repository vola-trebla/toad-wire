export function HowSapoThinks() {
  const discarded = [
    { title: 'AI agent sends memecoin to reply guy', reason: 'viral pero bajo impacto real' },
    { title: 'Blockchain apps failed the masses', reason: 'opinión, no noticia de mercado' },
    { title: 'Bitdeer dumps entire BTC reserves', reason: 'relevante pero menor escala' },
  ];

  const chosen = {
    title: 'ProShares stablecoin ETF debuta con $17B',
    reason: 'alto impacto, regulación + mercado real',
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
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
          letterSpacing: '-0.01em',
        }}
      >
        Así elige <span style={{ color: 'var(--green)' }}>El Sapo.</span>
      </h2>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          flex: 1,
        }}
      >
        {/* Stats */}
        <div style={{ color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.8' }}>
          <div>📡 133 artículos analizados desde 4 fuentes</div>
          <div>🔍 76 pasaron el filtro de relevancia</div>
          <div>🧠 LLM evaluó los mejores candidatos...</div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {/* Descartados */}
          {discarded.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '14px 1fr',
                gap: '8px',
                marginBottom: '12px',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
              }}
            >
              <span style={{ color: '#ff4444' }}>✗</span>
              <div>
                <span>"{item.title}"</span>
                <span style={{ color: '#555', display: 'block' }}>→ {item.reason}</span>
              </div>
            </div>
          ))}

          {/* Elegido */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '14px 1fr',
              gap: '8px',
              marginTop: '4px',
              color: 'var(--text)',
              lineHeight: '1.5',
            }}
          >
            <span style={{ color: 'var(--green)' }}>✓</span>
            <div>
              <span>"{chosen.title}"</span>
              <span style={{ color: 'var(--green)', display: 'block' }}>→ {chosen.reason}</span>
            </div>
          </div>
        </div>

        {/* Стрелка вниз к посту */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            color: 'var(--green)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            animation: 'pulse 2s infinite',
          }}
        >
          ↓ así nació este post ↓
        </div>
      </div>
    </section>
  );
}
