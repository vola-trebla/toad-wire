import { useState, useEffect } from 'react';
import { POSTS } from '../constants/posts';

function getRandomPost() {
  return POSTS[Math.floor(Math.random() * POSTS.length)];
}

export function LastPost() {
  const [post, setPost] = useState(getRandomPost);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setPost(getRandomPost());
      },
      2 * 60 * 60 * 1000,
    ); // 2 hours
    return () => clearInterval(interval);
  }, []);

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
        // RANDOM_POST.log
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--green)',
          marginBottom: '10px',
          lineHeight: 1.4,
        }}
      >
        {post.title}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-dim)',
          lineHeight: 1.7,
          marginBottom: '12px',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.text}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}
        >
          📊 {post.sentiment}
        </div>
        <div
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}
        >
          🔗 {post.source}
        </div>
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
  );
}
