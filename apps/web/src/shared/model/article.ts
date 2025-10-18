import type { PaginationInfo } from "./common";

/**
 * 記事のステータス
 */
export type ArticleStatus = "published" | "draft" | "archived";

/**
 * 言語コード
 */
export type LanguageCode = "ja" | "en";

/**
 * 記事オブジェクト（API レスポンス用）
 * バックエンドの ArticleSchema に対応
 */
export interface Article {
	/** 記事のユニークID */
	id: number;
	/** 記事のスラッグ */
	slug: string;
	/** Cloudflare画像ID */
	cfImageId: string | null;
	/** 記事のステータス */
	status: ArticleStatus;
	/** 公開日時 */
	publishedAt: string | null;
	/** 更新日時 */
	updatedAt?: string | null;
	/** 記事のタイトル */
	title: string | null;
	/** 記事の本文 */
	content: string | null;
	/** 記事の閲覧数（言語ごと） */
	viewCount: number;
}

/**
 * 記事一覧APIのレスポンス
 */
export interface ArticlesResponse {
	/** 記事データの配列 */
	data: Article[];
	/** ページネーション情報 */
	pagination: PaginationInfo;
}

/**
 * 記事詳細APIのレスポンス
 */
export interface ArticleResponse {
	/** 記事データ */
	data: Article;
}

/**
 * 記事一覧取得のクエリパラメータ
 */
export interface ArticlesQuery {
	/** ページ番号 */
	page?: string;
	/** 1ページあたりの記事数 */
	limit?: string;
	/** 言語 */
	lang?: LanguageCode;
	/** 記事のステータス */
	status?: ArticleStatus;
	/** 検索キーワード */
	search?: string;
	/** ソート対象フィールド */
	sortBy?: "createdAt" | "updatedAt" | "publishedAt" | "title" | "viewCount";
	/** ソート順序 */
	sortOrder?: "asc" | "desc";
}

/**
 * 記事詳細取得のクエリパラメータ
 */
export interface ArticleDetailQuery {
	/** 言語 */
	lang?: LanguageCode;
}

/**
 * 記事のフィルター条件（管理画面用）
 */
export interface ArticleFilters {
	/** ステータス */
	status: ArticleStatus | "all";
	/** 言語 */
	language: LanguageCode | "all";
	/** 検索キーワード */
	search: string;
}

/**
 * 記事のソート条件（管理画面用）
 */
export interface ArticleSort {
	/** ソート対象フィールド */
	field: "title" | "status" | "publishedAt" | "createdAt" | "updatedAt";
	/** ソート順序 */
	direction: "asc" | "desc";
}

/**
 * 記事表示用のヘルパー関数の戻り値型
 */
export interface ArticleDisplayData {
	/** 表示用のタイトル */
	displayTitle: string;
	/** 表示用のステータス */
	displayStatus: string;
	/** 表示用の公開日時 */
	displayPublishedAt: string;
	/** ステータスのバッジ色 */
	statusBadgeVariant:
		| "default"
		| "secondary"
		| "destructive"
		| "outline"
		| "success";
}

/**
 * 記事ステータスの表示設定
 */
export const ARTICLE_STATUS_CONFIG: Record<
	ArticleStatus,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline" | "success";
	}
> = {
	published: { label: "公開済み", variant: "success" },
	draft: { label: "下書き", variant: "secondary" },
	archived: { label: "アーカイブ", variant: "destructive" },
};

/**
 * 言語の表示設定
 */
export const LANGUAGE_CONFIG: Record<LanguageCode, { label: string }> = {
	ja: { label: "日本語" },
	en: { label: "English" },
};

/**
 * スラッグ重複チェックのクエリパラメータ
 */
export interface SlugCheckQuery {
	/** チェックするスラッグ */
	slug: string;
}

/**
 * スラッグ重複チェックのレスポンス
 */
export interface SlugCheckResponse {
	/** スラッグが利用可能かどうか */
	available: boolean;
	/** メッセージ（利用不可の場合など） */
	message?: string;
}

/**
 * 記事作成のリクエストデータ
 */
export interface ArticleCreateRequest {
	/** 記事のタイトル */
	title: string;
	/** 記事のスラッグ */
	slug: string;
	/** 記事の本文（Markdown形式） */
	content: string;
	/** 記事のステータス */
	status: ArticleStatus;
	/** 公開日時（オプショナル） */
	publishedAt?: string;
	/** タグIDの配列（オプショナル） */
	tagIds?: number[];
}

/**
 * 記事作成のレスポンス
 */
export interface ArticleCreateResponse {
	/** 作成された記事データ */
	data: Article;
	/** 作成成功メッセージ */
	message: string;
}
