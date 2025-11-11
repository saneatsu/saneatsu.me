CREATE TABLE IF NOT EXISTS `daily_article_contributions` (
	`date` text PRIMARY KEY NOT NULL,
	`updates` integer NOT NULL DEFAULT 0,
	`ja_char_count` integer NOT NULL DEFAULT 0,
	`updated_at` text NOT NULL DEFAULT (datetime('now'))
);
