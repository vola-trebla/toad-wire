export function Roadmap() {
  const nearTerm = [
    'Pipeline RSS → AI → Telegram estabilizado',
    'Resúmenes en español con tono consistente',
    'Mejor filtrado y prioridad de noticias',
    'Deduplicación mejorada',
    'Ciclo diario de posts refinado',
    'Landing page con precios en vivo ✅',
  ];

  const exploring = [
    'Integración con X (semi-manual)',
    'Más fuentes de noticias y feeds alternativos',
    'Snapshots de mercado más ricos',
    'Herramientas internas de monitoreo',
    'Bot interactivo para insights de wallets',
    'Fear & Greed Index en el sitio',
  ];

  return (
    <section
      id="roadmap"
      style={{
        padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px)',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.2em',
          marginBottom: '8px',
        }}
      >
        // ROADMAP.md
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px,4vw,36px)',
          fontWeight: 900,
          color: 'var(--text)',
          marginBottom: '12px',
          letterSpacing: '-0.01em',
        }}
      >
        El Sapo <span style={{ color: 'var(--green)' }}>evoluciona.</span>
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '48px',
          lineHeight: 1.7,
        }}
      >
        No hay promesas. No hay hype. Solo ingeniería tranquila. 🐸
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2px',
        }}
      >
        {[
          { label: '▸ AHORA', items: nearTerm, active: true },
          { label: '◈ EXPLORANDO', items: exploring, active: false },
        ].map(({ label, items, active }) => (
          <div
            key={label}
            style={{
              padding: '28px 24px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                color: active ? 'var(--green)' : 'var(--text-muted)',
                letterSpacing: '0.12em',
                marginBottom: '20px',
              }}
            >
              {label}
            </div>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: active ? 'var(--text-dim)' : 'var(--text-muted)',
                  marginBottom: '12px',
                  lineHeight: 1.6,
                  paddingLeft: '12px',
                  borderLeft: `1px solid ${active ? 'var(--green-dark)' : 'var(--border)'}`,
                }}
              >
                {item}
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '20px',
                height: '20px',
                borderTop: `2px solid ${active ? 'rgba(45,255,110,0.3)' : 'var(--border)'}`,
                borderRight: `2px solid ${active ? 'rgba(45,255,110,0.3)' : 'var(--border)'}`,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
