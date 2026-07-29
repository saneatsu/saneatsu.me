import type { Locale } from "@saneatsu/i18n";
import type { InferResponseType } from "hono/client";

import type { ApiClient } from "@/shared/lib/hono/client-type";

/**
 * 言語コード
 */
export type LanguageCode = Locale;

/**
 * 記事一覧APIのレスポンス（バックエンドの契約から導出）
 */
export type ArticlesResponse = InferResponseType<
	ApiClient["api"]["articles"]["$get"],
	200
>;

/**
 * 記事オブジェクト（一覧レスポンスの要素から導出）
 */
export type Article = ArticlesResponse["data"][number];

/**
 * 記事のステータス
 */
export type ArticleStatus = Article["status"];

/**
 * 記事詳細APIのレスポンス
 */
export type ArticleResponse = InferResponseType<
	ApiClient["api"]["articles"][":slug"]["$get"],
	200
>;

/**
 * 関連記事APIのレスポンス（ページネーションなし）
 */
export type RelatedArticlesResponse = InferResponseType<
	ApiClient["api"]["articles"][":slug"]["related"]["$get"],
	200
>;

/**
 * 記事一覧取得のクエリパラメータ（フロント側の入力アダプタ）
 *
 * @remarks
 * `lang` はフロント都合のパラメータ名で、API 送信時に `language` に変換される
 * （api-client.ts 参照）。API 契約そのものではないため導出せず手書きで保持する。
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
	es: { label: "Español" },
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
	/** 記事のステータス（新規作成時はdraftかpublishedのみ） */
	status: "draft" | "published";
	/** 公開日時（オプショナル） */
	publishedAt?: string;
	/** タグIDの配列（オプショナル） */
	tagIds?: number[];
	/** Cloudflare Image ID（オプショナル） */
	cfImageId?: string;
	/** 記事内で使用するギャラリー画像のID配列（オプショナル） */
	galleryImageIds?: number[];
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
