import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * ギャラリー画像テーブル
 * 位置情報付きの画像を管理
 *
 * @remarks
 * **設計方針 - cfImageIdについて:**
 *
 * cfImageIdには、"gallery-xxx"だけでなく"content-xxx"も保存可能。
 * これにより、記事内で使用した画像を後からギャラリーにも追加できる。
 *
 * 詳細は `apps/backend/src/lib/cloudflare-image-types/cloudflare-image-types.ts`
 * のImageIdPrefix型のコメントを参照。
 */
export const galleryImages = sqliteTable("gallery_images", {
	/** 画像ID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/**
	 * Cloudflare Images ID
	 *
	 * @remarks
	 * "gallery-xxx"または"content-xxx"のいずれかの形式を保存可能。
	 * 記事内の画像もギャラリーで表示できるように柔軟な設計としている。
	 */
	cfImageId: text("cf_image_id").notNull(),
	/** 緯度 */
	latitude: real("latitude"),
	/** 経度 */
	longitude: real("longitude"),
	/** 撮影日時 */
	takenAt: text("taken_at"),
	/** 作成日時 */
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	/** 更新日時 */
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
