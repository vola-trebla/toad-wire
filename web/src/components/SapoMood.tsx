import { MOODS, type Mood } from '../constants/moods';

interface Props {
  mood: Mood;
  glitching: boolean;
  onSwitch: (mood: Mood) => void;
}

export function SapoMood({ mood, glitching, onSwitch }: Props) {
  const currentMood = MOODS[mood];

  return (
    <section style={{ padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,80px)' }}>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '32px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            marginBottom: '20px',
          }}
        >
          // SAPO_MOOD.exe
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {(Object.keys(MOODS) as Mood[]).map((m) => (
            <button
              key={m}
              onClick={() => onSwitch(m)}
              style={{
                padding: '10px 20px',
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border:
                  mood === m
                    ? `2px solid ${m === 'bearish' ? 'var(--red)' : 'var(--green)'}`
                    : '2px solid var(--border)',
                background:
                  mood === m
                    ? m === 'bearish'
                      ? 'rgba(255,59,59,0.15)'
                      : 'rgba(45,255,110,0.15)'
                    : 'transparent',
                color:
                  mood === m
                    ? m === 'bearish'
                      ? 'var(--red)'
                      : 'var(--green)'
                    : 'var(--text-muted)',
              }}
            >
              {MOODS[m].emoji} {MOODS[m].label}
            </button>
          ))}
        </div>
        <div
          style={{
            padding: '28px 32px',
            background: 'var(--surface2)',
            border: `1px solid ${mood === 'bearish' ? 'rgba(255,59,59,0.3)' : 'rgba(45,255,110,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.3s',
            opacity: glitching ? 0 : 1,
            transform: glitching ? 'translateX(4px)' : 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '40px',
              color: mood === 'bearish' ? 'var(--red)' : 'var(--green)',
              lineHeight: 1,
              minWidth: '48px',
            }}
          >
            {currentMood.signal}
          </span>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 700,
                color: mood === 'bearish' ? 'var(--red)' : 'var(--green)',
                marginBottom: '6px',
                letterSpacing: '0.05em',
              }}
            >
              ÚLTIMA SEÑAL DEL SAPO
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                color: 'var(--text)',
                lineHeight: 1.5,
              }}
            >
              {currentMood.signalText}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
