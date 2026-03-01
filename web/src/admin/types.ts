export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  last_posted_at: string | null;
  last_article_in_db: string | null;
  llm_budget: {
    flash: {
      used: number;
      limit: number;
      remaining: number;
    };
    flash_lite: {
      used: number;
    };
    date: string;
  };
  micro_posts_pending: number;
  articles_pending: number;
  total_posts_pending: number;
  feeds: {
    total: number;
    healthy: number;
    degraded: number;
    dead: string[];
  };
  pipeline_24h: {
    runs: number;
    posts: number;
  };
}

export interface PipelineRun {
  id: number;
  type: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  articles_fetched: number | null;
  articles_filtered: number | null;
  articles_posted: number | null;
  micro_posts_generated: number | null;
  error: string | null;
}

export interface MetricsResponse {
  status: string;
  since: string;
  summary: {
    runs: number;
    posts: number;
    avg_duration_ms: number | null;
    articles_fetched: number;
    articles_filtered: number;
    micro_posts_generated: number;
    errors: number;
  };
  recent_runs: PipelineRun[];
}
