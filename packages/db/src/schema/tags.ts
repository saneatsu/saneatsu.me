import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * タグテーブル
 * タグの基本情報を管理
 */
export const tags = sqliteTable("tags", {
	/** タグID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/** URL用スラッグ（ユニーク制約） */
	slug: text("slug").notNull().unique(),
	/** 作成日時 */
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	/** 更新日時 */
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
