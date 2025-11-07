import type { GalleryImageStatus } from "@saneatsu/db";

/**
 * ギャラリー画像の翻訳データ
 */
export type GalleryImageTranslation = {
	/** 翻訳ID */
	id: number;
	/** ギャラリー画像ID */
	galleryImageId: number;
	/** 言語コード */
	language: "ja" | "en";
	/** 画像タイトル */
	title: string | null;
	/** 画像の説明 */
	description: string | null;
	/** 作成日時 */
	createdAt: string;
	/** 更新日時 */
	updatedAt: string;
};

/**
 * ギャラリー画像の型定義
 */
export type GalleryImage = {
	/** 画像ID */
	id: number;
	/** Cloudflare Images ID */
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
};

/**
 * ギャラリー画像一覧レスポンス
 */
export type GalleryImagesResponse = {
	/** 画像一覧 */
	images: GalleryImage[];
	/** 総画像数 */
	total: number;
	/** 現在のページ番号 */
	page: number;
	/** 1ページあたりの画像数 */
	limit: number;
};

/**
 * ギャラリー画像アップロードリクエスト
 */
export type GalleryImageUploadRequest = {
	/** 画像ファイル */
	file: File;
	/** タイトル（日本語） */
	titleJa?: string;
	/** 説明（日本語） */
	descriptionJa?: string;
	/** 緯度（オプショナル） */
	latitude?: number;
	/** 経度（オプショナル） */
	longitude?: number;
	/** 撮影日時（オプショナル） */
	takenAt?: string;
};

/**
 * ギャラリー画像アップロードレスポンス
 */
export type GalleryImageUploadResponse = {
	/** 画像ID */
	id: number;
	/** Cloudflare Images ID */
	imageId: string;
	/** 画像URL */
	imageUrl: string;
	/** メッセージ */
	message: string;
};

/**
 * ギャラリー画像更新用の翻訳データ
 */
export type GalleryImageUpdateTranslation = {
	/** 言語コード */
	language: "ja" | "en";
	/** タイトル（オプショナル） */
	title?: string;
	/** 説明（オプショナル） */
	description?: string;
};

/**
 * ギャラリー画像更新リクエスト
 */
export type GalleryImageUpdateRequest = {
	/** 翻訳データ（オプショナル） */
	translations?: GalleryImageUpdateTranslation[];
	/** 緯度（オプショナル） */
	latitude?: number;
	/** 経度（オプショナル） */
	longitude?: number;
	/** 撮影日時（オプショナル） */
	takenAt?: string;
	/** ステータス（オプショナル） */
	status?: GalleryImageStatus;
};

/**
 * ギャラリー画像更新レスポンス
 */
export type GalleryImageUpdateResponse = {
	/** 更新後の画像データ */
	data: GalleryImage;
	/** メッセージ */
	message: string;
};

/**
 * ギャラリー画像削除レスポンス
 */
export type GalleryImageDeleteResponse = {
	/** メッセージ */
	message: string;
};

/**
 * ギャラリー画像一覧取得のクエリパラメータ（管理画面用）
 */
export type GalleryImagesQueryParams = {
	/** ページ番号 */
	page?: number;
	/** 1ページあたりの画像数 */
	limit?: number;
	/** ソート基準 */
	sortBy?: "createdAt" | "takenAt" | "updatedAt";
	/** ソート順序 */
	sortOrder?: "asc" | "desc";
	/** 位置情報の有無でフィルタリング */
	hasLocation?: boolean;
};

/**
 * Admin用ギャラリー画像一覧取得のクエリパラメータ
 */
export type AdminGalleryImagesQueryParams = GalleryImagesQueryParams & {
	/** ステータスでフィルタリング（カンマ区切りで複数指定可能） */
	status?: string;
};

/**
 * ギャラリー画像一覧取得のクエリパラメータ（公開ギャラリー用）
 */
export type GalleryImagesQuery = {
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
};

/**
 * ジオコーディング検索の座標
 */
export type GeocodingCoordinates = {
	/** 経度 */
	longitude: number;
	/** 緯度 */
	latitude: number;
};

/**
 * ジオコーディング検索結果
 */
export type GeocodingFeature = {
	/** 場所の名前 */
	name: string;
	/** 完全な住所 */
	fullAddress: string;
	/** 座標 */
	coordinates: GeocodingCoordinates;
};

/**
 * ジオコーディング検索のクエリパラメータ
 */
export type GeocodingSearchParams = {
	/** 検索クエリ（住所、地名など） */
	q: string;
	/** 言語コード */
	language?: "ja" | "en";
	/** 結果の最大数 */
	limit?: number;
};

/**
 * ジオコーディング検索レスポンス
 */
export type GeocodingSearchResponse = {
	/** 検索結果の配列 */
	features: GeocodingFeature[];
};

/**
 * ギャラリー画像を使用している記事
 */
export type ArticleByGalleryImage = {
	/** 記事ID */
	id: number;
	/** 記事スラッグ */
	slug: string;
	/** 記事タイトル（日本語） */
	title: string | null;
	/** 記事のステータス */
	status: "draft" | "published" | "archived";
	/** 公開日時 */
	publishedAt: string | null;
	/** サムネイル画像のCloudflare Images ID */
	cfImageId: string | null;
	/** 作成日時 */
	createdAt: string;
};

/**
 * ギャラリー画像を使用している記事一覧のレスポンス
 */
export type ArticlesByGalleryImageResponse = {
	/** 記事一覧 */
	articles: ArticleByGalleryImage[];
	/** 総記事数 */
	total: number;
};
