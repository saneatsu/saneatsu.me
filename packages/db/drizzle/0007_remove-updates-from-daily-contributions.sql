PRAGMA foreign_keys=off;

CREATE TABLE `daily_article_contributions_new` (
	`date` text PRIMARY KEY NOT NULL,
	`ja_char_count` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);

INSERT INTO `daily_article_contributions_new` (
	`date`,
	`ja_char_count`,
	`updated_at`
)
SELECT
	`date`,
	`ja_char_count`,
	`updated_at`
FROM `daily_article_contributions`;

DROP TABLE `daily_article_contributions`;

ALTER TABLE `daily_article_contributions_new`
RENAME TO `daily_article_contributions`;

PRAGMA foreign_keys=on;
