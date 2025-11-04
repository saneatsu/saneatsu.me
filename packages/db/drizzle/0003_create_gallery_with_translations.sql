CREATE TABLE `gallery_image_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gallery_image_id` integer NOT NULL,
	`language` text NOT NULL,
	`title` text,
	`description` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`gallery_image_id`) REFERENCES `gallery_images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniqueGalleryImageLanguage` ON `gallery_image_translations` (`gallery_image_id`,`language`);--> statement-breakpoint
CREATE TABLE `gallery_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cf_image_id` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`taken_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
DROP INDEX `article_translations_article_id_language_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `uniqueArticleLanguage` ON `article_translations` (`article_id`,`language`);