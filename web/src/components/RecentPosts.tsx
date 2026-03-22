import { useState, useEffect } from 'react';

interface Article {
  id: number;
  title: string;
  source: string;
  category: string | null;
  sentiment: string | null;
  tweet: string | null;
  url: string;
  createdAt: string | null;
}

const SENTIMENT_COLOR = {
  bullish: '#2dff6e',
  bearish: '#ff3b3b',
  neutral: '#4a9eff',
};

const SENTIMENT_LABEL = {
  bullish: '🚀 Positive',
  bearish: '🩸 Negative',
  neutral: '🔵 Neutral',
};

const CATEGORY_ICON: Record<string, string> = {
  general: '🌍',
  ai: '🤖',
  tech: '⚙️',
  finance: '📈',
  politics: '⚖️',
  security: '🔒',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function RecentPosts() {
  const [posts, setPosts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const token = import.meta.env.VITE_ADMIN_TOKEN || '';

    fetch(`${apiUrl}/recent`, {
      headers: { 'x-admin-token': token },
    })
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.articles ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            marginBottom: '8px',
          }}
        >
          // WIRE_SIGNALS.log
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '16px',
            marginBottom: '40px',
            flexWrap: 'wrap',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px,4vw,36px)',
              fontWeight: 900,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Latest <span style={{ color: 'var(--green)' }}>Wire Signals</span>
          </h2>
          {!loading && !error && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--green)',
                letterSpacing: '0.1em',
              }}
            >
              ● DATA_INCOMING
            </span>
          )}
        </div>

        {loading && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              padding: '40px 0',
            }}
          >
            // loading signals...
          </div>
        )}

        {error && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              padding: '40px 0',
            }}
          >
            // the wire is offline, reconnecting...
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '2px',
            }}
          >
            {posts.map((post) => {
              const sKey = (post.sentiment || 'neutral') as keyof typeof SENTIMENT_COLOR;
              const cKey = post.category || 'tech';
              const color = SENTIMENT_COLOR[sKey] || '#4a9eff';

              return (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: '24px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      height: '100%',
                      boxSizing: 'border-box',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = `${color}44`;
                      el.style.background = 'var(--surface2)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--border)';
                      el.style.background = 'var(--surface)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            color,
                            letterSpacing: '0.1em',
                          }}
                        >
                          {SENTIMENT_LABEL[sKey] || '🔵 Neutral'}
                        </span>
                        <span style={{ color: 'var(--border)' }}>·</span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {CATEGORY_ICON[cKey] || '⚙️'} {cKey}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {post.createdAt ? timeAgo(post.createdAt) : ''}
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        lineHeight: 1.4,
                        marginBottom: '12px',
                      }}
                    >
                      {post.title}
                    </div>

                    {post.tweet && (
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--text-dim)',
                          lineHeight: 1.6,
                          borderLeft: `2px solid ${color}33`,
                          paddingLeft: '10px',
                        }}
                      >
                        {post.tweet.slice(0, 120)}
                        {post.tweet.length > 120 ? '…' : ''}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      🔗 {post.source}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '16px',
                        height: '16px',
                        borderTop: `2px solid ${color}44`,
                        borderRight: `2px solid ${color}44`,
                      }}
                    />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
