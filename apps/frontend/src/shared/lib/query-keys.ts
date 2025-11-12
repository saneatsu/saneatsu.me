import type { ArticleStatus } from "@saneatsu/schemas";

/**
 * React Query用のクエリキー定義
 *
 * クエリキーの設計原則：
 * 1. 階層的な構造で整理
 * 2. 一意性を保証
 * 3. 無効化しやすい粒度で定義
 * 4. TypeScriptの型推論を活用
 */
export const queryKeys = {
	/**
	 * 記事関連のクエリキー
	 */
	article: {
		// すべての記事（フィルタリング可能）
		all: (filters?: {
			status?: string[];
			tagIds?: number[];
			language?: string;
			search?: string;
			page?: number;
			limit?: number;
			sortBy?: string;
			sortOrder?: string;
		}) =>
			filters ? (["articles", filters] as const) : (["articles"] as const),
		// 個別の記事（スラッグ指定）
		bySlug: (slug: string, lang?: string) =>
			["articles", slug, { lang }] as const,
		// 記事詳細
		detail: (params: { slug: string; language?: string }) =>
			["articles", "detail", params] as const,
		// スラッグ重複チェック
		checkSlug: (slug: string) => ["articles", "check-slug", slug] as const,
		// Wiki Linkサジェスト
		suggestions: (params: {
			query: string;
			language?: string;
			limit?: number;
			targetSlug?: string;
		}) => ["articles", "suggestions", params] as const,
		// 関連記事
		related: (slug: string, lang?: string, limit?: number) =>
			["articles", "related", { slug, lang, limit }] as const,
	},

	/**
	 * タグ関連のクエリキー
	 */
	tag: {
		// すべてのタグ（ステータスフィルタリング可能）
		all: (status?: ArticleStatus) =>
			status ? (["tags", { status }] as const) : (["tags"] as const),
	},

	/**
	 * ダッシュボード関連のクエリキー
	 */
	dashboard: {
		// ダッシュボード概要
		overview: (lang?: string) => ["dashboard", "overview", { lang }] as const,
		// 閲覧数推移
		viewsTrend: (lang?: string, days?: number) =>
			["dashboard", "views-trend", { lang, days }] as const,
		// 詳細統計
		stats: (lang?: string, timeRange?: string) =>
			["dashboard", "stats", { lang, timeRange }] as const,
	},

	/**
	 * 執筆データ関連
	 */
	contributions: {
		public: (range?: number, locale?: string) =>
			["contributions", "public", { range, locale }] as const,
	},

	/**
	 * ギャラリー関連のクエリキー
	 */
	gallery: {
		// すべてのギャラリー画像（フィルタリング可能）
		all: (filters?: {
			page?: number;
			limit?: number;
			hasLocation?: boolean;
			sortBy?: "takenAt" | "createdAt" | "updatedAt";
			sortOrder?: "asc" | "desc";
			status?: string;
		}) => ["gallery", "images", filters] as const,
		// 個別のギャラリー画像
		byId: (id: number, language?: string) =>
			["gallery", "images", id, { language }] as const,
	},

	/**
	 * ジオコーディング関連のクエリキー
	 */
	geocoding: {
		// 住所検索
		search: (params: { q: string; language?: string; limit?: number }) =>
			["geocoding", "search", params] as const,
	},
} as const;

// エクスポートエイリアス
export const ARTICLE_QUERY_KEYS = queryKeys.article;
export const TAG_QUERY_KEYS = queryKeys.tag;
export const DASHBOARD_QUERY_KEYS = queryKeys.dashboard;
export const CONTRIBUTION_QUERY_KEYS = queryKeys.contributions;
export const GALLERY_QUERY_KEYS = queryKeys.gallery;
export const GEOCODING_QUERY_KEYS = queryKeys.geocoding;
