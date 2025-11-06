CREATE TABLE `article_gallery_images` (
	`article_id` integer NOT NULL,
	`gallery_image_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`article_id`, `gallery_image_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gallery_image_id`) REFERENCES `gallery_images`(`id`) ON UPDATE no action ON DELETE cascade
);
