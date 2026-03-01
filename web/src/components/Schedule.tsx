import { useState } from 'react';
import { SCHEDULE } from '../constants/schedule';

type DayType = 'weekday' | 'weekend';

export function Schedule() {
  const [dayType, setDayType] = useState<DayType>('weekday');

  const filtered = SCHEDULE.filter((item) => {
    if (dayType === 'weekday') return !item.weekendOnly;
    if (dayType === 'weekend') return !item.weekdayOnly;
    return true;
  });

  return (
    <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
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
            fontSize: 'clamp(22px,4vw,36px)',
            fontWeight: 900,
            color: 'var(--text)',
            marginBottom: '32px',
            letterSpacing: '-0.01em',
          }}
        >
          ¿Qué publica <span style={{ color: 'var(--green)' }}>el sapo</span>?
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '32px' }}>
          {(['weekday', 'weekend'] as DayType[]).map((type) => (
            <button
              key={type}
              onClick={() => setDayType(type)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.15em',
                padding: '8px 20px',
                background: dayType === type ? 'var(--green)' : 'var(--surface)',
                color: dayType === type ? '#000' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: dayType === type ? 'var(--green)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: dayType === type ? 700 : 400,
              }}
            >
              {type === 'weekday' ? '// LUNES–VIERNES' : '// FIN DE SEMANA'}
            </button>
          ))}
          <div
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {dayType === 'weekend' ? '↑ +2 posts vs semana' : `${filtered.length} posts / día`}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2px',
          }}
        >
          {filtered.map((item, i) => (
            <div
              key={i}
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
      </div>
    </section>
  );
}
