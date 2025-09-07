import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { articles } from "./articles";

/**
 * タグテーブル
 * 記事に付けられるタグを管理
 */
export const tags = sqliteTable("tags", {
	/** タグID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/** タグスラッグ（ユニーク制約） */
	slug: text("slug").notNull().unique(),
	/** 作成日時 */
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	/** 更新日時 */
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * 記事タグ関連テーブル
 * 記事とタグの多対多の関係を管理
 */
export const articleTags = sqliteTable("article_tags", {
	/** 記事ID */
	articleId: integer("article_id")
		.notNull()
		.references(() => articles.id, { onDelete: "cascade" }),
	/** タグID */
	tagId: integer("tag_id")
		.notNull()
		.references(() => tags.id, { onDelete: "cascade" }),
});
