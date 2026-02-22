import { useState, useEffect } from 'react';
import { useCryptoPrices } from './hooks/useCryptoPrices';

type Mood = 'neutral' | 'bullish' | 'bearish';

interface MoodConfig {
  label: string;
  emoji: string;
  color: string;
  signal: string;
  signalText: string;
  tagline: string;
  cta: string;
}

const MOODS: Record<Mood, MoodConfig> = {
  neutral: {
    label: 'NEUTRAL',
    emoji: '🐸',
    color: '#2dff6e',
    signal: '─',
    signalText: 'El mercado respira. El sapo observa.',
    tagline: 'Sin drama. Sin FOMO. Solo datos.',
    cta: 'Únete al canal',
  },
  bullish: {
    label: 'BULLISH',
    emoji: '🚀🐸',
    color: '#2dff6e',
    signal: '▲',
    signalText: '¡Las ranas saltan cuando hay sangre verde!',
    tagline: 'El sapo huele oportunidad. ¿Tú también?',
    cta: '¡Únete ahora!',
  },
  bearish: {
    label: 'BEARISH',
    emoji: '🐸💀',
    color: '#ff3b3b',
    signal: '▼',
    signalText: 'El mercado llora. El sapo toma notas.',
    tagline: 'Cuando todos venden, el sapo analiza.',
    cta: 'No entres en pánico →',
  },
};

const TICKER_ITEMS = [
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'ADA',
  'AVAX',
  'DOT',
  'LINK',
  'UNI',
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'ADA',
  'AVAX',
  'DOT',
  'LINK',
  'UNI',
];

const SCHEDULE = [
  {
    time: '10:00',
    icon: '☀️',
    title: 'Buenos días, LATAM',
    desc: 'Precios de apertura + las noticias que importaron anoche. Con café o sin café.',
  },
  {
    time: '12:00',
    icon: '📡',
    title: 'Flash del mediodía',
    desc: 'La movida más importante de las últimas horas. Directo al punto.',
  },
  {
    time: '15:00',
    icon: '🔍',
    title: 'Análisis de la tarde',
    desc: 'Contexto, no ruido. Una noticia, bien explicada.',
  },
  {
    time: '18:00',
    icon: '📊',
    title: 'Cierre americano',
    desc: 'Wall Street habló. ¿Qué significa para el cripto? El sapo traduce.',
  },
  {
    time: '21:00',
    icon: '🌙',
    title: 'Buenas noches',
    desc: 'Resumen del día + lo que vigilar mañana. Duerme tranquilo (o no).',
  },
];

export default function App() {
    const prices = useCryptoPrices(['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'AVAX', 'DOT', 'LINK', 'UNI'])
  const [mood, setMood] = useState<Mood>('neutral');
  const [time, setTime] = useState(new Date());
  const [glitching, setGlitching] = useState(false);

  const currentMood = MOODS[mood];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const switchMood = (newMood: Mood) => {
    setGlitching(true);
    setTimeout(() => {
      setMood(newMood);
      setGlitching(false);
    }, 300);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ticker */}
      <div
        style={{
          background: currentMood.color === '#ff3b3b' ? '#1a0a0a' : '#050f05',
          borderBottom: `1px solid ${currentMood.color}22`,
          overflow: 'hidden',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            animation: 'ticker 20s linear infinite',
            whiteSpace: 'nowrap',
          }}
        >
          {TICKER_ITEMS.map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: currentMood.color,
                padding: '0 24px',
                opacity: 0.7,
                letterSpacing: '0.15em',
              }}
            >
              {item} {prices[`${item}USDT`] ? `$${prices[`${item}USDT`].toLocaleString()}` : '...'}{' '}
              <span style={{ opacity: 0.4 }}>///</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
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
      </header>

      {/* Hero */}
      <section
        style={{
          padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 80px)',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Frog glyph */}
        <div
          className="animate-fade-up"
          style={{
            fontSize: 'clamp(80px, 15vw, 140px)',
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
            fontSize: 'clamp(32px, 7vw, 80px)',
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
            fontSize: 'clamp(13px, 2vw, 17px)',
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
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 var(--green-dark)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'none';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
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
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--green)';
              (e.currentTarget as HTMLElement).style.color = '#050f05';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--green)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Seguir en X
          </a>
        </div>
      </section>

      {/* Sapo Mood */}
      <section
        style={{
          padding: 'clamp(40px, 6vw, 80px) clamp(20px, 5vw, 80px)',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
                onClick={() => switchMood(m)}
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

      {/* Schedule */}
      <section
        style={{
          padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)',
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
          // SCHEDULE.json
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontWeight: 900,
            color: 'var(--text)',
            marginBottom: '48px',
            letterSpacing: '-0.01em',
          }}
        >
          ¿Qué publica <span style={{ color: 'var(--green)' }}>el sapo</span>?
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2px',
          }}
        >
          {SCHEDULE.map((item, i) => (
            <div
              key={i}
              className={`animate-fade-up delay-${i + 1}`}
              style={{
                padding: '28px 24px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                transition: 'all 0.2s',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'var(--surface2)';
                el.style.borderColor = 'rgba(45,255,110,0.3)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'var(--surface)';
                el.style.borderColor = 'var(--border)';
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.15em',
                  marginBottom: '12px',
                }}
              >
                {item.time} ART/UYT
              </div>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--green)',
                  marginBottom: '8px',
                  letterSpacing: '0.05em',
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  lineHeight: 1.7,
                }}
              >
                {item.desc}
              </div>

              {/* Corner accent */}
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
          ))}
        </div>
      </section>

      {/* Why / Mission */}
      <section
        style={{
          padding: 'clamp(40px, 6vw, 80px) clamp(20px, 5vw, 80px)',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🌎</div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 4vw, 34px)',
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
              margin: '0 auto 32px',
            }}
          >
            Las noticias cripto importantes aparecen primero en inglés. El sapo las traduce, las
            resume y las envía a tu Telegram en español rioplatense — sin tecnicismos innecesarios,
            sin hype, sin drama.
            <br />
            <br />
            Como si un amigo que sabe cripto te mandara un mensaje.
          </p>
          <div
            style={{
              display: 'inline-flex',
              gap: '32px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[
              { val: '5×', label: 'posts por día' },
              { val: '4', label: 'fuentes cripto' },
              { val: '∞', label: 'ranas' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(28px, 5vw, 42px)',
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

      {/* CTA Final */}
      <section
        style={{
          padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 80px)',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            marginBottom: '24px',
          }}
        >
          // JOIN_SAPO.sh
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 5vw, 52px)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '16px',
            letterSpacing: '-0.01em',
          }}
        >
          El mercado no espera.
          <br />
          <span style={{ color: 'var(--green)' }}>El sapo tampoco.</span>
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: 'var(--text-dim)',
            marginBottom: '40px',
          }}
        >
          Gratis. En Telegram. Ahora mismo.
        </p>
        <a
          href="https://t.me/ElSapoCripto"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '18px 40px',
            background: 'var(--green)',
            color: '#050f05',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translate(-3px, -3px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 var(--green-dark)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'none';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          🐸 ENTRAR AL CANAL
        </a>
      </section>

      {/* Footer */}
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
          <span
            style={{
              animation: 'blink 1.2s step-end infinite',
              color: 'var(--green)',
            }}
          >
            ▌
          </span>
          Hecho en LATAM con 🐸
        </div>
      </footer>
    </div>
  );
}
