import { useFearGreed } from '../hooks/useFearGreed';

function getColor(value: number): string {
  if (value <= 25) return '#ff3b3b';
  if (value <= 45) return '#ff8c00';
  if (value <= 55) return '#ffb700';
  if (value <= 75) return '#2dff6e';
  return '#00ff99';
}

export function FearGreed() {
  const data = useFearGreed();

  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        position: 'relative',
        minWidth: '200px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.2em',
          marginBottom: '16px',
        }}
      >
        // FEAR_GREED.exe
      </div>

      {data ? (
        <>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '52px',
              fontWeight: 900,
              color: getColor(data.value),
              lineHeight: 1,
              marginBottom: '8px',
            }}
          >
            {data.value}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              color: getColor(data.value),
              letterSpacing: '0.12em',
            }}
          >
            {data.classification.toUpperCase()}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { range: '0–24', label: 'Extreme Fear', color: '#ff3b3b' },
              { range: '25–45', label: 'Fear', color: '#ff8c00' },
              { range: '46–55', label: 'Neutral', color: '#ffb700' },
              { range: '56–75', label: 'Greed', color: '#2dff6e' },
              { range: '76–100', label: 'Extreme Greed', color: '#00ff99' },
            ].map(({ range, label, color }) => (
              <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color,
                    minWidth: '48px',
                    opacity: data && getColor(data.value) === color ? 1 : 0.35,
                  }}
                >
                  {range}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color,
                    opacity: data && getColor(data.value) === color ? 1 : 0.35,
                    fontWeight: data && getColor(data.value) === color ? 700 : 400,
                  }}
                >
                  {label}
                </span>
                {data && getColor(data.value) === color && (
                  <span style={{ color, fontSize: '10px' }}>◀</span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}
        >
          ...
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '20px',
          height: '20px',
          borderTop: '2px solid rgba(45,255,110,0.3)',
          borderRight: '2px solid rgba(45,255,110,0.3)',
        }}
      />
    </div>
  );
}
