import { sql } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { articles } from "./articles";

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

/**
 * タグ翻訳テーブル
 * タグの言語別名称を管理
 */
export const tagTranslations = sqliteTable("tag_translations", {
	/** 翻訳ID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/** タグ名 */
	name: text("name").notNull(),
	/** 言語コード（ja: 日本語, en: 英語） */
	language: text("language", { enum: ["ja", "en"] }).notNull(),
	/** タグID（外部キー） */
	tagId: integer("tag_id")
		.notNull()
		.references(() => tags.id, { onDelete: "cascade" }),
});

/**
 * 記事タグ中間テーブル
 * 記事とタグの多対多の関係を管理
 */
export const articleTags = sqliteTable(
	"article_tags",
	{
		/** 記事ID（外部キー） */
		articleId: integer("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		/** タグID（外部キー） */
		tagId: integer("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(table) => ({
		/** 複合主キー（記事IDとタグIDの組み合わせ） */
		pk: primaryKey({ columns: [table.articleId, table.tagId] }),
	})
);
