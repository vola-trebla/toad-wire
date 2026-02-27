export function Roadmap() {
  const core1 = [
    'Pipeline global → español',
    'Resúmenes con voz del Sapo',
    'Deduplicación + ranking LLM',
    'Snapshot diario del mercado',
    'Modo Degén v0',
    'Publicación automática',
  ];

  const core2 = [
    'Lectura inteligente de X',
    'Detección de posts clave',
    'Respuestas con humor ácido',
    'Clasificador noticia/meme/alerta',
    'Catalina-mode',
    'Persona persistente',
  ];

  const core3 = [
    'Monitoreo de ballenas',
    'Alertas de liquidaciones',
    'Movimientos on-chain',
    'Perfiles rápidos de wallets',
    'Actividad por tokens',
    'Clasificación de señales',
  ];

  const future = [
    'Archivo completo de señales',
    'API del Sapo',
    'Extensión “El Sapo te lo explica”',
    'Traducciones EN/PT',
    'Dos Sapos hablando 🤣',
  ];

  const sphereStyle = (active: boolean) => ({
    width: '260px',
    height: '260px',
    borderRadius: '9999px',
    background: active
      ? 'radial-gradient(circle, rgba(0,255,100,0.25), rgba(0,0,0,0.70))'
      : 'radial-gradient(circle, rgba(0,255,100,0.10), rgba(0,0,0,0.60))',
    border: active ? '1px solid rgba(0,255,120,0.35)' : '1px solid rgba(0,255,120,0.20)',
    boxShadow: active
      ? '0 0 18px rgba(0,255,120,0.30) inset'
      : '0 0 10px rgba(0,255,120,0.15) inset',

    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center', // ближе к центру сферы
    padding: '22px 18px',
    gap: '10px',
    overflow: 'hidden',
  });

  const titleStyle = {
    fontFamily: 'var(--font-display)',
    fontSize: '12px',
    letterSpacing: '0.04em',
    color: 'var(--green)',
    textAlign: 'center' as const,
    lineHeight: 1.1,
    marginBottom: '2px',
  };

  const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    width: '100%',
    alignItems: 'center',
  };

  const itemStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10.5px',
    lineHeight: 1.15,
    textAlign: 'center' as const,
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    hyphens: 'auto' as const,
    maxWidth: '100%',
  };

  // FUTURO как “таблица/карточка”
  const futureCard = {
    padding: '28px 24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    position: 'relative' as const,
  };

  return (
    <section
      id="roadmap"
      style={{
        padding: 'clamp(60px,8vw,120px) clamp(20px,5vw,80px)',
        maxWidth: '980px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px,5vw,40px)',
          fontWeight: 900,
          color: 'var(--green)',
          marginBottom: '46px',
          textAlign: 'center',
        }}
      >
        Mapa del Cerebro del Sapo
      </h2>

      {/* TRIANGLE GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: 'auto auto auto',
          gap: '28px',
          alignItems: 'center',
          justifyItems: 'center',
          position: 'relative',
        }}
      >
        {/* TOP (CORE 1) */}
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <div style={sphereStyle(true)}>
            <div style={titleStyle}>CORE I — LA MÁQUINA</div>
            <ul style={listStyle}>
              {core1.map((t, i) => (
                <li key={i} style={{ ...itemStyle, color: 'var(--text-dim)' }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* LEFT (CORE 2) */}
        <div style={{ gridColumn: 1, gridRow: 3 }}>
          <div style={sphereStyle(false)}>
            <div style={titleStyle}>CORE II — LA JABA SOCIAL</div>
            <div
              style={{
                color: 'var(--green)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                lineHeight: 1.1,
                textAlign: 'center',
                marginTop: '-6px',
              }}
            >
              EN DESARROLLO
            </div>
            <ul style={{ ...listStyle, marginTop: '2px' }}>
              {core2.map((t, i) => (
                <li key={i} style={{ ...itemStyle, color: 'var(--text-muted)' }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT (CORE 3) */}
        <div style={{ gridColumn: 3, gridRow: 3 }}>
          <div style={sphereStyle(false)}>
            <div style={titleStyle}>CORE III — ON-CHAIN</div>
            <div
              style={{
                color: 'var(--green)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                lineHeight: 1.1,
                textAlign: 'center',
                marginTop: '-6px',
              }}
            >
              EN DESARROLLO
            </div>
            <ul style={{ ...listStyle, marginTop: '2px' }}>
              {core3.map((t, i) => (
                <li key={i} style={{ ...itemStyle, color: 'var(--text-muted)' }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CENTER (🧠🤖 only) */}
        <div
          style={{
            gridColumn: 2,
            gridRow: 2,
            textAlign: 'center',
            pointerEvents: 'none',
            transform: 'translateY(2px)',
          }}
        >
          <div
            style={{
              width: '86px',
              height: '86px',
              lineHeight: 1,
              margin: '0 auto',
              transform: 'translateY(0px)',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.35))',
            }}
          >
            <img
              src="/frog.png"
              alt="Sapo"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
        </div>

        {/* CENTER LABELS — чуть ниже между ядрами */}
        <div
          style={{
            gridColumn: 2,
            gridRow: 2,
            textAlign: 'center',
            pointerEvents: 'none',
            transform: 'translateY(56px)', // <-- опустили
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--green)',
              marginTop: '6px',
            }}
          >
            SAPO BRAIN
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            CORE 1 activo · CORE 2 + CORE 3 en desarrollo
          </div>
        </div>
      </div>

      {/* FUTURO — таблица/карточки */}
      <div style={{ marginTop: '70px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2px',
          }}
        >
          {[{ label: '◎ FUTURO', items: future, active: false }].map(({ label, items, active }) => (
            <div key={label} style={futureCard}>
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
      </div>

      {/* Responsive: сферы в колонку */}
      <style>{`
        @media (max-width: 860px) {
          #roadmap > div[style*="grid-template-columns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }
          #roadmap > div[style*="grid-template-columns: 1fr 1fr 1fr"] > div {
            grid-column: auto !important;
            grid-row: auto !important;
          }
        }
      `}</style>
    </section>
  );
}
