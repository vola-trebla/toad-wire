import { MOODS, type Mood } from '../constants/moods';
import { LastPost } from './LastPost';
import { HowSapoThinks } from './HowSapoThinks';
import * as React from 'react';

interface Props {
  mood: Mood;
}

export function Hero({ mood }: Props) {
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
            {/* halo */}
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

            {/* ring */}
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

            {/* frog */}
            <img
              src="/frog.png"
              alt="Frog"
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                display: 'block',
                zIndex: 2,

                // “подтянуть” картинку под стиль сайта
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
            {/*<a*/}
            {/*  href="https://t.me/ElSapoCripto"*/}
            {/*  target="_blank"*/}
            {/*  rel="noopener noreferrer"*/}
            {/*  style={{*/}
            {/*    display: 'inline-flex',*/}
            {/*    alignItems: 'center',*/}
            {/*    gap: '10px',*/}
            {/*    padding: '14px 28px',*/}
            {/*    background: 'var(--green)',*/}
            {/*    color: '#050f05',*/}
            {/*    fontFamily: 'var(--font-display)',*/}
            {/*    fontWeight: 700,*/}
            {/*    fontSize: '13px',*/}
            {/*    letterSpacing: '0.05em',*/}
            {/*    textDecoration: 'none',*/}
            {/*    transition: 'all 0.2s',*/}
            {/*  }}*/}
            {/*  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {*/}
            {/*    const el = e.currentTarget;*/}
            {/*    el.style.transform = 'translate(-2px,-2px)';*/}
            {/*    el.style.boxShadow = '4px 4px 0 var(--green-dark)';*/}
            {/*  }}*/}
            {/*  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {*/}
            {/*    const el = e.currentTarget;*/}
            {/*    el.style.transform = 'none';*/}
            {/*    el.style.boxShadow = 'none';*/}
            {/*  }}*/}
            {/*>*/}
            {/*  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">*/}
            {/*    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.547c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.51 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.306.97z" />*/}
            {/*  </svg>*/}
            {/*  {currentMood.cta}*/}
            {/*</a>*/}

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
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 w-full md:max-w-115">
          <HowSapoThinks />
          <LastPost />
        </div>
      </div>
    </section>
  );
}
