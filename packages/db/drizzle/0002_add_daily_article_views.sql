CREATE TABLE `daily_article_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_article_views_date_unique` ON `daily_article_views` (`date`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_article_tags` (
	`article_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_article_tags`("article_id", "tag_id") SELECT "article_id", "tag_id" FROM `article_tags`;--> statement-breakpoint
DROP TABLE `article_tags`;--> statement-breakpoint
ALTER TABLE `__new_article_tags` RENAME TO `article_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `articles` ADD `author_id` integer REFERENCES users(id);
