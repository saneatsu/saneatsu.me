import { integer, primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";
import { articles } from "./articles";
import { tags } from "./tags";

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
	(table) => [
		/** 複合主キー（記事IDとタグIDの組み合わせ） */
		primaryKey({ columns: [table.articleId, table.tagId] }),
	]
);
