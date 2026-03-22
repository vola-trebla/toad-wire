import { MOODS, type Mood } from '../constants/moods';
import { HowSapoThinks } from './HowSapoThinks';

interface Props {
  mood: Mood;
  glitching: boolean;
  switchMood: (m: Mood) => void;
}

export function Hero({ mood, glitching, switchMood }: Props) {
  const currentMood = MOODS[mood];

  return (
    <section
      style={{
        padding: 'clamp(60px,10vw,120px) clamp(20px,5vw,80px)',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          display: 'flex',
          gap: '48px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Left column */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          {/* Frog */}
          <div
            style={{
              width: 'clamp(80px,15vw,140px)',
              aspectRatio: '1/1',
              marginBottom: '24px',
              display: 'inline-grid',
              placeItems: 'center',
              position: 'relative',
              isolation: 'isolate',
              transform: 'translateZ(0)',
              willChange: 'transform, filter',
              animation: 'float 4s ease-in-out infinite, fadeUp 0.7s ease both',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-18%',
                borderRadius: '9999px',
                background:
                  'radial-gradient(circle, rgba(45,255,110,0.18) 0%, rgba(45,255,110,0.06) 45%, rgba(0,0,0,0) 70%)',
                filter: 'blur(10px)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '6%',
                borderRadius: '9999px',
                border: '1px solid rgba(45,255,110,0.22)',
                boxShadow: '0 0 18px rgba(45,255,110,0.10) inset',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
            <img
              src="/frog.png"
              alt="Frog"
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                display: 'block',
                zIndex: 2,
                filter: 'drop-shadow(0 16px 26px rgba(0,0,0,0.40)) saturate(1.06) contrast(1.04)',
                transform: 'translateZ(0)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '10%',
                borderRadius: '9999px',
                background:
                  'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.14), rgba(255,255,255,0) 55%)',
                mixBlendMode: 'screen',
                opacity: 0.65,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Title */}
          <h1
            className="animate-fade-up delay-1 glow-text"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px,7vw,80px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            <span style={{ color: 'var(--green)' }}>TOAD</span>
            <br />
            <span style={{ color: 'var(--text)' }}>WIRE</span>
          </h1>

          {/* Tagline */}
          <div
            className="animate-fade-up delay-2"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(13px,2vw,17px)',
              color: 'var(--text-dim)',
              marginBottom: '32px',
              maxWidth: '520px',
              lineHeight: 1.7,
            }}
          >
            {currentMood.tagline.replace('Sapo', 'Toad-Wire')}
            <br />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Universal News Pipeline · AI-Driven Intelligence · Real-time Stream
            </span>
          </div>

          {/* CTA */}
          <div
            className="animate-fade-up delay-3"
            style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
          >
            <a
              href="https://x.com/ElSapoCripto"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                background: 'transparent',
                color: 'var(--green)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textDecoration: 'none',
                border: '1px solid var(--green)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                const el = e.currentTarget;
                el.style.background = 'var(--green)';
                el.style.color = '#050f05';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                const el = e.currentTarget;
                el.style.background = 'transparent';
                el.style.color = 'var(--green)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Seguir en X
            </a>
          </div>

          {/* SAPO_MOOD compact */}
          <div className="animate-fade-up delay-4" style={{ marginTop: '40px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                letterSpacing: '0.2em',
                marginBottom: '12px',
              }}
            >
              // SAPO_MOOD.exe
            </div>

            {/* Mood tabs */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
              {(Object.keys(MOODS) as Mood[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMood(m)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border:
                      mood === m
                        ? `1px solid ${m === 'bearish' ? 'var(--red)' : 'var(--green)'}`
                        : '1px solid var(--border)',
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

            {/* Signal */}
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--surface)',
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
                  fontSize: '20px',
                  fontWeight: 900,
                  color: mood === 'bearish' ? 'var(--red)' : 'var(--green)',
                  lineHeight: 1,
                  minWidth: '54px',
                  letterSpacing: '-0.02em',
                }}
              >
                {currentMood.signal}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: mood === 'bearish' ? 'var(--red)' : 'var(--green)',
                    marginBottom: '4px',
                    letterSpacing: '0.1em',
                  }}
                >
                  ENGINE_STATUS_REPORT
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text)',
                    lineHeight: 1.5,
                  }}
                >
                  {currentMood.signalText}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 w-full md:max-w-115">
          <HowSapoThinks />
        </div>
      </div>
    </section>
  );
}
