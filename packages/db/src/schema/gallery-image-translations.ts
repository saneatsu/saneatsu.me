import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { galleryImages } from "./gallery-images";

/**
 * ギャラリー画像翻訳テーブル
 * 画像のタイトルと説明の多言語対応を管理
 *
 * @remarks
 * 設計方針:
 * - 言語依存のコンテンツ（title, description）を分離
 * - 各画像は複数の言語で翻訳を持つことができる
 * - (galleryImageId, language)の組み合わせでユニーク制約
 */
export const galleryImageTranslations = sqliteTable(
	"gallery_image_translations",
	{
		/** 翻訳ID（自動インクリメント） */
		id: integer("id").primaryKey({ autoIncrement: true }),
		/** ギャラリー画像ID（外部キー） */
		galleryImageId: integer("gallery_image_id")
			.notNull()
			.references(() => galleryImages.id, { onDelete: "cascade" }),
		/** 言語コード（ja, en） */
		language: text("language", { enum: ["ja", "en"] }).notNull(),
		/** 画像タイトル */
		title: text("title"),
		/** 画像の説明 */
		description: text("description"),
		/** 作成日時 */
		createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
		/** 更新日時 */
		updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
	},
	(table) => [
		// 同じ画像の同じ言語の翻訳は1つまで
		unique("uniqueGalleryImageLanguage").on(
			table.galleryImageId,
			table.language
		),
	]
);
