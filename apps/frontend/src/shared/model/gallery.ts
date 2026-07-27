import type { GalleryImageStatus } from "@saneatsu/db";
import type { Locale } from "@saneatsu/i18n";
import type { InferResponseType } from "hono/client";

import type { ApiClient } from "@/shared/lib/hono/client-type";

/**
 * 言語コード
 */
export type LanguageCode = Locale;

/**
 * ギャラリー画像のステータス（再エクスポート）
 */
export type { GalleryImageStatus };

/**
 * ギャラリー画像一覧レスポンス（バックエンドの契約から導出）
 */
export type GalleryImagesResponse = InferResponseType<
	ApiClient["api"]["gallery"]["$get"],
	200
>;

/**
 * ギャラリー画像データ（一覧レスポンスの要素から導出）
 */
export type GalleryImage = GalleryImagesResponse["images"][number];

/**
 * ギャラリー画像翻訳データ（画像の翻訳配列の要素から導出）
 */
export type GalleryImageTranslation = GalleryImage["translations"][number];

/**
 * ギャラリー画像一覧取得のクエリパラメータ
 */
export interface GalleryImagesQuery {
	/** ページ番号 */
	page?: string;
	/** 1ページあたりの画像数 */
	limit?: string;
	/** ソート基準 */
	sortBy?: "createdAt" | "takenAt" | "updatedAt";
	/** ソート順序 */
	sortOrder?: "asc" | "desc";
	/** 位置情報の有無でフィルタリング */
	hasLocation?: "true" | "false";
}

/**
 * ギャラリー画像ステータスの表示設定
 */
export const GALLERY_IMAGE_STATUS_CONFIG: Record<
	GalleryImageStatus,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline" | "success";
	}
> = {
	published: { label: "公開済み", variant: "success" },
	draft: { label: "下書き", variant: "secondary" },
};
