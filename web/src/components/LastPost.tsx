import { useLastPost } from '../hooks/useLastPost';

export function LastPost() {
  const post = useLastPost();

  const formatDate = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'var(--surface)',
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
          marginBottom: '16px',
        }}
      >
        // LAST_POST.log
      </div>

      {post ? (
        <>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-dim)',
              lineHeight: 1.7,
              marginBottom: '12px',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.text}
          </div>
          <div
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}
          >
            {formatDate(post.date)}
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
