import { sql } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

import { articles } from "./articles";
import { galleryImages } from "./gallery-images";

/**
 * 記事とギャラリー画像の紐付けテーブル（中間テーブル）
 *
 * @description
 * 記事とギャラリー画像の多対多の関連を管理する。
 * 記事内で使用されたギャラリー画像を追跡し、
 * ギャラリー画像から「この画像を使用している記事」を逆算できるようにする。
 *
 * @remarks
 * **設計方針:**
 * - 記事作成/更新時に、使用したギャラリー画像のIDを保存
 * - ギャラリー画像から記事を逆引き可能
 * - 記事やギャラリー画像が削除された場合、関連レコードも自動削除（CASCADE）
 */
export const articleGalleryImages = sqliteTable(
	"article_gallery_images",
	{
		/** 記事ID */
		articleId: integer("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		/** ギャラリー画像ID */
		galleryImageId: integer("gallery_image_id")
			.notNull()
			.references(() => galleryImages.id, { onDelete: "cascade" }),
		/** 作成日時（紐付けが行われた日時） */
		createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	},
	(table) => ({
		/** 複合主キー（同じ記事と画像の組み合わせは1つまで） */
		pk: primaryKey({ columns: [table.articleId, table.galleryImageId] }),
	})
);
