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
	 * タグ関連のクエリキー
	 */
	tag: {
		// すべてのタグ（言語指定可能）
		all: (lang?: "ja" | "en") => ["tags", { lang }] as const,
		// 個別のタグ（ID指定）
		byId: (id: number) => ["tags", id] as const,
		// スラッグによるタグ取得
		bySlug: (slug: string) => ["tags", "slug", slug] as const,
		// スラッグ重複チェック
		checkSlug: (slug: string) => ["tags", "check-slug", slug] as const,
	},

	/**
	 * 記事関連のクエリキー
	 */
	article: {
		// すべての記事（フィルタリング可能）
		all: (filters?: {
			status?: string;
			language?: string;
			search?: string;
			page?: number;
			limit?: number;
			sortBy?: string;
			sortOrder?: string;
		}) => ["articles", filters] as const,
		// 個別の記事（スラッグ指定）
		bySlug: (slug: string, lang?: string) =>
			["articles", slug, { lang }] as const,
		// スラッグ重複チェック
		checkSlug: (slug: string) => ["articles", "check-slug", slug] as const,
		// Wiki Linkサジェスト
		suggestions: (params: {
			query: string;
			language?: string;
			limit?: number;
		}) => ["articles", "suggestions", params] as const,
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
} as const;

// エクスポートエイリアス
export const TAG_QUERY_KEYS = queryKeys.tag;
export const ARTICLE_QUERY_KEYS = queryKeys.article;
export const DASHBOARD_QUERY_KEYS = queryKeys.dashboard;
