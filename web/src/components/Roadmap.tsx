import { useState } from 'react';

interface CoreProcess {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  status: 'RUNNING' | 'QUEUED' | 'PENDING';
  progress: number;
  features: { text: string; done: boolean }[];
  pid: string;
  uptime?: string;
}

const CORES: CoreProcess[] = [
  {
    id: 'CORE_I',
    label: 'PROCESS 001',
    title: 'CORE I — THE ENGINE',
    subtitle: 'Ingestion Engine v2.0',
    status: 'RUNNING',
    progress: 100,
    pid: '1337',
    uptime: '24/7',
    features: [
      { text: 'Global Pipeline: Ingestion from 1024+ sources', done: true },
      { text: 'Impact Score v2.0 — multi-factor relevance scoring', done: true },
      { text: '4-level deduplication + story clustering', done: true },
      { text: 'LLM-driven signal ranking and synthesis', done: true },
      { text: 'Breaking news detection threshold < 10 min', done: true },
      { text: 'Automated visualization and image generation', done: true },
      { text: 'Multi-channel broadcasting: Telegram + X', done: true },
      { text: 'Real-time market and sentiment snapshots', done: true },
      { text: 'Feed health monitoring + automated circuit breakers', done: true },
      { text: 'System-wide metrics and observability dashboard', done: true },
    ],
  },
  {
    id: 'CORE_II',
    label: 'PROCESS 002',
    title: 'CORE II — SOCIAL SYNTHESIS',
    subtitle: 'Social Intelligence Layer',
    status: 'RUNNING',
    progress: 45,
    pid: '2048',
    features: [
      { text: 'Intelligent real-time monitoring of social feeds', done: true },
      { text: 'Engagement-based key post detection', done: true },
      { text: 'Automated contextual response engine', done: false },
      { text: 'News / Meme / Alert classification system', done: true },
      { text: 'Persistent persona across conversation threads', done: false },
      { text: 'Interactive query interface for engine status', done: false },
    ],
  },
  {
    id: 'CORE_III',
    label: 'PROCESS 003',
    title: 'CORE III — REASONING',
    subtitle: 'Deep Analysis Processor',
    status: 'QUEUED',
    progress: 0,
    pid: '—',
    features: [
      { text: 'On-chain activity and whale movement monitoring', done: false },
      { text: 'Large-scale liquidation and market pressure alerts', done: false },
      { text: 'Suspicious transaction pattern detection', done: false },
      { text: 'Rapid entity and wallet profiling', done: false },
      { text: 'Protocol-level activity tracking', done: false },
      { text: 'Predictive signal classification', done: false },
    ],
  },
];

const FUTURE = [
  'Historical signal archive and search',
  'TOAD-WIRE Public API access',
  'Browser Extension for real-time analysis',
  'Multi-language translation pipelines',
  'Collaborative multi-agent reasoning',
  'Global Entity Knowledge Graph',
];

const STATUS_COLOR: Record<string, string> = {
  RUNNING: '#2dff6e',
  QUEUED: '#4a5568',
  PENDING: '#2d3748',
};

const STATUS_DOT: Record<string, string> = {
  RUNNING: '●',
  QUEUED: '○',
  PENDING: '◎',
};

export function Roadmap() {
  const [expanded, setExpanded] = useState<string | null>('CORE_I');

  return (
    <section
      id="roadmap"
      style={{
        padding: 'clamp(60px,8vw,120px) clamp(20px,5vw,80px)',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            marginBottom: '8px',
          }}
        >
          // WIRE_ARCHITECTURE.sys
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px,5vw,40px)',
            fontWeight: 900,
            color: 'var(--text)',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          System <span style={{ color: 'var(--green)' }}>Development</span> Roadmap
        </h2>
      </div>

      {/* Process list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {CORES.map((core) => {
          const isExpanded = expanded === core.id;
          const isActive = core.status === 'RUNNING';

          return (
            <div
              key={core.id}
              style={{
                background: isExpanded ? 'var(--surface)' : 'transparent',
                border: '1px solid',
                borderColor: isExpanded
                  ? isActive
                    ? 'rgba(45,255,110,0.25)'
                    : 'var(--border)'
                  : 'transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => setExpanded(isExpanded ? null : core.id)}
            >
              {/* Process header row */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr auto auto',
                  gap: '16px',
                  alignItems: 'center',
                  borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* PID + label */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.15em',
                      marginBottom: '2px',
                    }}
                  >
                    {core.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    PID {core.pid}
                  </div>
                </div>

                {/* Title + progress bar */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isActive ? 'var(--text)' : 'var(--text-muted)',
                      marginBottom: '8px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {core.title}
                  </div>
                  {/* Progress bar */}
                  <div
                    style={{
                      height: '3px',
                      background: 'var(--border)',
                      borderRadius: '0',
                      overflow: 'hidden',
                      maxWidth: '300px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${core.progress}%`,
                        background: isActive ? 'var(--green)' : '#2d3748',
                        transition: 'width 0.6s ease',
                        boxShadow: isActive ? '0 0 8px rgba(45,255,110,0.5)' : 'none',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      marginTop: '5px',
                    }}
                  >
                    {core.subtitle}
                    {core.uptime && (
                      <span style={{ color: 'var(--green)', marginLeft: '12px' }}>
                        ↑ {core.uptime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress % */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: isActive ? 'var(--green)' : 'var(--text-muted)',
                    fontWeight: 700,
                    minWidth: '42px',
                    textAlign: 'right',
                  }}
                >
                  {core.progress}%
                </div>

                {/* Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '90px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ color: STATUS_COLOR[core.status], fontSize: '10px' }}>
                    {STATUS_DOT[core.status]}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: STATUS_COLOR[core.status],
                      letterSpacing: '0.1em',
                    }}
                  >
                    {core.status}
                  </span>
                </div>
              </div>

              {/* Expanded feature list */}
              {isExpanded && (
                <div
                  style={{
                    padding: '20px 24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '10px 32px',
                  }}
                >
                  {core.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: f.done ? 'var(--green)' : '#2d3748',
                          marginTop: '1px',
                          flexShrink: 0,
                        }}
                      >
                        {f.done ? '✓' : '·'}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: f.done ? 'var(--text-dim)' : 'var(--text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FUTURE */}
      <div
        style={{
          marginTop: '40px',
          padding: '24px',
          border: '1px solid var(--border)',
          position: 'relative',
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
          ◎ FUTURE — On the horizon
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '10px 32px',
          }}
        >
          {FUTURE.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--border)',
                  marginTop: '1px',
                  flexShrink: 0,
                }}
              >
                ···
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '20px',
            height: '20px',
            borderTop: '2px solid var(--border)',
            borderRight: '2px solid var(--border)',
          }}
        />
      </div>

      {/* Bottom label */}
      <div
        style={{
          marginTop: '24px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'right',
        }}
      >
        TOAD-WIRE BRAIN · CORE 1 Active · CORE 2 Processing
      </div>
    </section>
  );
}
