import { AdminGate } from './AdminGate';
import { AdminDashboard } from './AdminDashboard';
import { API_BASE_URL } from '../config';

export function AdminPage() {
  return (
    <AdminGate>
      <div className="min-h-screen bg-(--bg) text-(--text) px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-(--text-muted)">
                El Sapo Cripto
              </p>
              <h1 className="font-display text-2xl tracking-widest text-(--green)">Admin</h1>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-(--text-muted)">API</div>
              <div className="text-xs text-(--text) max-w-[280px] truncate">{API_BASE_URL}</div>
              <div className="text-[10px] text-(--text-muted)">/admin</div>
            </div>
          </header>
          <AdminDashboard />
        </div>
      </div>
    </AdminGate>
  );
}
