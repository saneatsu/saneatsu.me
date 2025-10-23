ALTER TABLE `articles` ADD `view_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `article_translations` DROP COLUMN `view_count`;