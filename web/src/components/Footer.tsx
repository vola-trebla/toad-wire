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
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        © 2026 TOAD-WIRE · Autonomous Intelligence Pipeline · No noise, just the wire.
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
        <span style={{ animation: 'pulse 1.2s ease-in-out infinite', color: 'var(--green)' }}>
          ▌
        </span>
        Driven by 🐸 and Signal
      </div>
    </footer>
  );
}
