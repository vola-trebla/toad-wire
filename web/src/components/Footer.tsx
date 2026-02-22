export function Footer() {
  return (
    <footer
      style={{
        padding: '24px 40px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
        © 2026 El Sapo Cripto · No es asesoramiento financiero · El sapo no es responsable de tus
        decisiones
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ animation: 'blink 1.2s step-end infinite', color: 'var(--green)' }}>▌</span>
        Hecho en LATAM con 🐸
      </div>
    </footer>
  );
}
