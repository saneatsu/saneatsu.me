import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * 記事テーブル
 * 記事の基本情報を管理（言語別のコンテンツは別テーブル）
 */
export const articles = sqliteTable("articles", {
	/** 記事ID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/** URL用スラッグ（ユニーク制約） */
	slug: text("slug").notNull().unique(),
	/** Cloudflare Images ID（サムネイル画像） */
	cfImageId: text("cf_image_id"),
	/** ステータス（published: 公開済み, draft: 下書き, archived: アーカイブ済み） */
	status: text("status", {
		enum: ["published", "draft", "archived"],
	})
		.notNull()
		.default("draft"),
	/** 公開日時 */
	publishedAt: text("published_at"),
	/** 作成日時 */
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	/** 更新日時 */
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
