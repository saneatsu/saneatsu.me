import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * 日別記事閲覧数テーブル
 * 全記事の日別合計閲覧数を記録
 */
export const dailyArticleViews = sqliteTable("daily_article_views", {
	/** ID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/** 日付（YYYY-MM-DD形式） */
	date: text("date").notNull().unique(),
	/** その日の全記事の合計閲覧数 */
	viewCount: integer("view_count").notNull().default(0),
});
