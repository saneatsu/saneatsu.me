import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * 記事の執筆アクティビティ（日次）
 */
export const dailyArticleContributions = sqliteTable(
	"daily_article_contributions",
	{
		/** 日本時間の日付 (YYYY-MM-DD) */
		date: text("date").primaryKey(),
		/** その日に増えた日本語文字数 */
		jaCharCount: integer("ja_char_count").notNull().default(0),
		/** レコードの最終更新日時 */
		updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
	}
);
