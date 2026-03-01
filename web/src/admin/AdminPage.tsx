import { AdminGate } from './AdminGate';
import { AdminDashboard } from './AdminDashboard';

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
            <span className="text-xs text-(--text-muted)">/admin</span>
          </header>
          <AdminDashboard />
        </div>
      </div>
    </AdminGate>
  );
}
