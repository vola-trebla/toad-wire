import { MOODS, type Mood } from '../constants/moods';

interface Props {
  mood: Mood;
}

export function Hero({ mood }: Props) {
  const currentMood = MOODS[mood];

  return (
    <section
      style={{
        padding: 'clamp(60px,10vw,120px) clamp(20px,5vw,80px)',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        className="animate-fade-up"
        style={{
          fontSize: 'clamp(80px,15vw,140px)',
          lineHeight: 1,
          marginBottom: '24px',
          animation: 'float 4s ease-in-out infinite, fadeUp 0.7s ease both',
          display: 'inline-block',
        }}
      >
        🐸
      </div>
      <h1
        className="animate-fade-up delay-1"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px,7vw,80px)',
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}
      >
        <span style={{ color: 'var(--green)' }}>EL SAPO</span>
        <br />
        <span style={{ color: 'var(--text)' }}>CRIPTO</span>
      </h1>
      <div
        className="animate-fade-up delay-2"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(13px,2vw,17px)',
          color: 'var(--text-dim)',
          marginBottom: '48px',
          maxWidth: '520px',
          lineHeight: 1.7,
        }}
      >
        {currentMood.tagline}
        <br />
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Noticias cripto en español · Para LATAM · Sin complicaciones
        </span>
      </div>

      <div
        className="animate-fade-up delay-3"
        style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
      >
        <a
          href="https://t.me/ElSapoCripto"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            background: 'var(--green)',
            color: '#050f05',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.05em',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            const el = e.currentTarget;
            el.style.transform = 'translate(-2px,-2px)';
            el.style.boxShadow = '4px 4px 0 var(--green-dark)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            const el = e.currentTarget;
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.547c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.51 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.306.97z" />
          </svg>
          {currentMood.cta}
        </a>

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
    </section>
  );
}
