import type { GalleryImageStatus } from "@saneatsu/db";

/**
 * 言語コード
 */
export type LanguageCode = "ja" | "en";

/**
 * ギャラリー画像のステータス（再エクスポート）
 *
 * @remarks
 * スキーマから抽出された型をここで再エクスポートしているのだ。
 */
export type { GalleryImageStatus };

/**
 * ギャラリー画像翻訳データ
 */
export interface GalleryImageTranslation {
	/** 翻訳ID */
	id: number;
	/** ギャラリー画像ID */
	galleryImageId: number;
	/** 言語コード */
	language: LanguageCode;
	/** タイトル */
	title: string | null;
	/** 説明 */
	description: string | null;
	/** 作成日時 */
	createdAt: string;
	/** 更新日時 */
	updatedAt: string;
}

/**
 * ギャラリー画像データ
 */
export interface GalleryImage {
	/** 画像ID */
	id: number;
	/** Cloudflare Image ID */
	cfImageId: string;
	/** 翻訳データ */
	translations: GalleryImageTranslation[];
	/** 緯度 */
	latitude: number | null;
	/** 経度 */
	longitude: number | null;
	/** 撮影日時 */
	takenAt: string | null;
	/** ステータス */
	status: GalleryImageStatus;
	/** 作成日時 */
	createdAt: string;
	/** 更新日時 */
	updatedAt: string;
}

/**
 * ギャラリー画像一覧レスポンス
 */
export interface GalleryImagesResponse {
	/** 画像データの配列 */
	images: GalleryImage[];
	/** 総画像数 */
	total: number;
	/** 現在のページ番号 */
	page: number;
	/** 1ページあたりの画像数 */
	limit: number;
}

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
