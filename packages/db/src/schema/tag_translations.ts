import { locales } from "@saneatsu/i18n";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { tags } from "./tags";

/**
 * タグ翻訳テーブル
 * タグの言語別名称を管理
 */
export const tagTranslations = sqliteTable("tag_translations", {
	/** 翻訳ID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/** タグ名 */
	name: text("name").notNull(),
	/** 言語コード */
	language: text("language", { enum: [...locales] }).notNull(),
	/** タグID（外部キー） */
	tagId: integer("tag_id")
		.notNull()
		.references(() => tags.id, { onDelete: "cascade" }),
});
