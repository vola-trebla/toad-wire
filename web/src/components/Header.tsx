interface Props {
  time: Date;
}

export function Header({ time }: Props) {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header
      style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--green)',
          letterSpacing: '0.1em',
        }}
      >
        EL SAPO CRIPTO
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button
          onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--green)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ROADMAP
        </button>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              animation: 'pulse-green 2s infinite',
            }}
          />
          LIVE · {formatTime(time)} UY
        </div>
      </div>
    </header>
  );
}
