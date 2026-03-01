import { useAdminHealth } from './hooks/useAdminHealth';
import { useAdminMetrics } from './hooks/useAdminMetrics';
import type { PipelineRun } from './types';

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatUptime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
};

const formatDuration = (ms: number | null) => {
  if (!ms && ms !== 0) return '—';
  const seconds = Math.round(ms / 1000);
  return `${seconds}s`;
};

export function AdminDashboard() {
  const health = useAdminHealth(30000);
  const metrics = useAdminMetrics(60000);

  const loading = (health.loading && !health.data) || (metrics.loading && !metrics.data);

  if (loading) {
    return <div className="text-sm text-(--text-muted) animate-pulse">Loading admin data…</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-(--green)">HEALTH</h2>
          {health.error && <span className="text-xs text-red-400">{health.error}</span>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-(--border) bg-black/40 p-4">
            <p className="text-xs uppercase tracking-widest text-(--text-muted)">System</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-(--green)">{health.data?.status ?? 'unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime</span>
                <span>{health.data ? formatUptime(health.data.uptime_seconds) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Last posted</span>
                <span>{formatDateTime(health.data?.last_posted_at ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last article</span>
                <span className="max-w-[220px] truncate text-right">
                  {health.data?.last_article_in_db ?? '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-(--border) bg-black/40 p-4">
            <p className="text-xs uppercase tracking-widest text-(--text-muted)">Queues</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total posts pending</span>
                <span>{health.data?.total_posts_pending ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Articles pending</span>
                <span>{health.data?.articles_pending ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Micro posts pending</span>
                <span>{health.data?.micro_posts_pending ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Pipeline runs (24h)</span>
                <span>{health.data?.pipeline_24h?.runs ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Posts (24h)</span>
                <span>{health.data?.pipeline_24h?.posts ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>LLM remaining</span>
                <span>{health.data?.llm_budget?.flash?.remaining ?? '—'}</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-(--border) bg-black/40 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-(--text-muted)">Feeds</p>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <div className="flex justify-between">
                <span>Total</span>
                <span>{health.data?.feeds?.total ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Healthy</span>
                <span>{health.data?.feeds?.healthy ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Degraded</span>
                <span>{health.data?.feeds?.degraded ?? '—'}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-(--text-muted)">
              Dead feeds:{' '}
              {health.data?.feeds?.dead?.length ? health.data.feeds.dead.join(', ') : 'None'}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-(--green)">METRICS</h2>
          {metrics.error && <span className="text-xs text-red-400">{metrics.error}</span>}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-(--border) bg-black/40 p-4">
            <p className="text-xs uppercase tracking-widest text-(--text-muted)">Runs (24h)</p>
            <p className="mt-3 text-2xl font-display text-(--green)">
              {metrics.data?.summary?.runs ?? '—'}
            </p>
            <p className="text-xs text-(--text-muted)">
              Avg duration: {formatDuration(metrics.data?.summary?.avg_duration_ms ?? null)}
            </p>
          </div>
          <div className="rounded-xl border border-(--border) bg-black/40 p-4">
            <p className="text-xs uppercase tracking-widest text-(--text-muted)">Posts (24h)</p>
            <p className="mt-3 text-2xl font-display text-(--green)">
              {metrics.data?.summary?.posts ?? '—'}
            </p>
            <p className="text-xs text-(--text-muted)">
              Errors: {metrics.data?.summary?.errors ?? '—'}
            </p>
          </div>
          <div className="rounded-xl border border-(--border) bg-black/40 p-4">
            <p className="text-xs uppercase tracking-widest text-(--text-muted)">Articles (24h)</p>
            <div className="mt-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Fetched</span>
                <span>{metrics.data?.summary?.articles_fetched ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Filtered</span>
                <span>{metrics.data?.summary?.articles_filtered ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Micro posts</span>
                <span>{metrics.data?.summary?.micro_posts_generated ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-(--border) bg-black/40 p-4">
          <p className="text-xs uppercase tracking-widest text-(--text-muted)">Recent runs</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-(--text-muted)">
                <tr>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Started</th>
                  <th className="py-2 pr-3">Duration</th>
                  <th className="py-2 pr-3">Posted</th>
                  <th className="py-2 pr-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.data?.recent_runs ?? []).map((run: PipelineRun) => (
                  <tr key={run.id} className="border-t border-(--border)">
                    <td className="py-2 pr-3">{run.type}</td>
                    <td className="py-2 pr-3">{formatDateTime(run.started_at)}</td>
                    <td className="py-2 pr-3">{formatDuration(run.duration_ms)}</td>
                    <td className="py-2 pr-3">{run.articles_posted ?? 0}</td>
                    <td className="py-2 pr-3 text-red-400">{run.error ?? '—'}</td>
                  </tr>
                ))}
                {!metrics.data?.recent_runs?.length && (
                  <tr>
                    <td className="py-3 text-(--text-muted)" colSpan={5}>
                      No recent runs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
