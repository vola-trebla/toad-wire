export function Mission() {
  const stats = [
    { val: '8×', label: 'posts por día' },
    { val: '13', label: 'fuentes cripto' },
    { val: '2', label: 'canales (TG + X)' },
    { val: '∞', label: 'ranas' },
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
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🌎</div>
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
          El cripto <span style={{ color: 'var(--green)' }}>habla español</span>.<br />
          El mercado, no tanto.
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
          Las noticias cripto importantes aparecen primero en inglés. El sapo las traduce, las
          resume y las publica en Telegram y X — sin tecnicismos innecesarios, sin hype, sin drama.
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
          13 fuentes monitoreadas en tiempo real. Scoring algorítmico. Resúmenes con IA. Alertas de
          breaking news en menos de 10 minutos.
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
          Como si un amigo que sabe cripto te mandara un mensaje. Pero ese amigo no duerme.
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
