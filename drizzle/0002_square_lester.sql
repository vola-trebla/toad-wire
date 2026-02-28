CREATE TABLE `feed_health` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`url` text NOT NULL,
	`tier` integer NOT NULL,
	`authority` real NOT NULL,
	`enabled` integer DEFAULT true,
	`health_status` text DEFAULT 'healthy',
	`consecutive_failures` integer DEFAULT 0,
	`last_successful_fetch` text,
	`total_fetches` integer DEFAULT 0,
	`total_articles` integer DEFAULT 0,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_health_source_unique` ON `feed_health` (`source`);--> statement-breakpoint
CREATE TABLE `pipeline_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`articles_fetched` integer DEFAULT 0,
	`articles_filtered` integer DEFAULT 0,
	`articles_posted` integer DEFAULT 0,
	`micro_posts_generated` integer DEFAULT 0,
	`flash_rpd_used` integer DEFAULT 0,
	`flash_lite_rpd_used` integer DEFAULT 0,
	`duration_ms` integer,
	`error` text
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `tier` integer;--> statement-breakpoint
ALTER TABLE `articles` ADD `authority` real;--> statement-breakpoint
ALTER TABLE `articles` ADD `category` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `sentiment` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `importance_score` real;--> statement-breakpoint
ALTER TABLE `articles` ADD `tweet` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `cluster_id` text;