CREATE TABLE `micro_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`hashtags` text NOT NULL,
	`mood` text NOT NULL,
	`batch_type` text NOT NULL,
	`channel` text DEFAULT 'x' NOT NULL,
	`posted` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
