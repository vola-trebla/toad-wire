CREATE TABLE `bot_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `persona_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `x_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tweet_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_handle` text NOT NULL,
	`content` text NOT NULL,
	`type` text NOT NULL,
	`classification` text,
	`engagement_score` real,
	`reply_id` text,
	`reply_text` text,
	`replied_at` text,
	`persona_mode` text,
	`skipped` integer DEFAULT false,
	`skip_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `x_interactions_tweet_id_unique` ON `x_interactions` (`tweet_id`);--> statement-breakpoint
CREATE TABLE `x_monitored_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`handle` text NOT NULL,
	`user_id` text,
	`category` text NOT NULL,
	`priority` integer DEFAULT 1,
	`last_checked_at` text,
	`enabled` integer DEFAULT true
);
--> statement-breakpoint
CREATE UNIQUE INDEX `x_monitored_accounts_handle_unique` ON `x_monitored_accounts` (`handle`);