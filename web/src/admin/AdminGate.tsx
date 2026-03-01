import { useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'sapo_admin_ok';

interface Props {
  children: ReactNode;
}

export function AdminGate({ children }: Props) {
  const expected = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(() => {
    if (!expected) return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // This is a convenience-only client gate; do not treat as secure auth.
    if (!expected) {
      setAuthorized(true);
      return;
    }

    if (password === expected) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setAuthorized(true);
    } else {
      setError('Invalid password.');
    }
  };

  if (authorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-(--bg) text-(--text) flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-(--border) bg-black/40 rounded-xl p-6 shadow-lg">
        <h1 className="font-display text-xl text-(--green) tracking-widest">ADMIN ACCESS</h1>
        <p className="mt-2 text-sm text-(--text-muted)">
          This page is protected by a simple client-side password gate.
        </p>
        {!expected && (
          <p className="mt-3 text-xs text-yellow-300">
            VITE_ADMIN_PASSWORD is not set. Access is currently open.
          </p>
        )}
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs uppercase tracking-widest text-(--text-muted)">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-(--border) bg-black/60 px-3 py-2 text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--green)"
            placeholder="Enter admin password"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-(--green) text-black font-display text-sm tracking-widest py-2 hover:bg-(--green)/80 transition"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
