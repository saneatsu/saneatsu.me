import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { articles } from "./articles";

/**
 * 記事翻訳テーブル
 * 記事の言語別コンテンツを管理
 */
export const articleTranslations = sqliteTable(
	"article_translations",
	{
		/** 翻訳ID（自動インクリメント） */
		id: integer("id").primaryKey({ autoIncrement: true }),
		/** 記事タイトル */
		title: text("title").notNull(),
		/** Markdown形式の本文 */
		content: text("content").notNull(),
		/** 言語コード（ja: 日本語, en: 英語） */
		language: text("language", { enum: ["ja", "en"] }).notNull(),
		/** 記事ID（外部キー） */
		articleId: integer("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
	},
	(table) => [
		// 同じ記事IDと言語の組み合わせは1つしか存在できない
		unique("uniqueArticleLanguage").on(table.articleId, table.language),
	]
);
