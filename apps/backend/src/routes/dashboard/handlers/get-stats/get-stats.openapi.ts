import { createRoute, z } from "@hono/zod-openapi";

/**
 * OpenAPI用のクエリスキーマ
 */
const dashboardStatsOpenApiQuerySchema = z.object({
	language: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "統計データを取得する言語",
	}),
	timeRange: z.string().optional().openapi({
		example: "30",
		description: "時系列データの期間（日数、7-90日）",
	}),
});

/**
 * 記事統計スキーマ
 */
const articleStatsOpenApiSchema = z.object({
	totalArticles: z.number().int().openapi({
		example: 25,
		description: "総記事数",
	}),
	publishedArticles: z.number().int().openapi({
		example: 20,
		description: "公開済み記事数",
	}),
	draftArticles: z.number().int().openapi({
		example: 3,
		description: "下書き記事数",
	}),
	archivedArticles: z.number().int().openapi({
		example: 2,
		description: "アーカイブ記事数",
	}),
	thisMonthArticles: z.number().int().openapi({
		example: 5,
		description: "今月の新規作成記事数",
	}),
	totalViews: z.number().int().openapi({
		example: 1250,
		description: "総閲覧数",
	}),
	thisMonthViews: z.number().int().openapi({
		example: 350,
		description: "今月の閲覧数",
	}),
});

/**
 * 人気記事スキーマ
 */
const popularArticleOpenApiSchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	title: z.string(),
	viewCount: z.number().int(),
	publishedAt: z.string().nullable(),
});

/**
 * 日別統計スキーマ
 */
const dailyStatsOpenApiSchema = z.object({
	date: z.string().openapi({
		example: "2024-01-15",
		description: "日付（YYYY-MM-DD形式）",
	}),
	articlesCreated: z.number().int().openapi({
		example: 2,
		description: "その日に作成された記事数",
	}),
	views: z.number().int().openapi({
		example: 45,
		description: "その日の閲覧数",
	}),
});

/**
 * ダッシュボード統計レスポンススキーマ
 */
const dashboardStatsOpenApiResponseSchema = z.object({
	articleStats: articleStatsOpenApiSchema,
	popularArticles: z.object({
		articles: z.array(popularArticleOpenApiSchema).max(10),
	}),
	timeSeriesStats: z.object({
		last30Days: z.array(dailyStatsOpenApiSchema).max(30),
	}),
	lastUpdated: z.string().datetime(),
});

/**
 * エラースキーマ
 */
const errorSchema = z.object({
	error: z.string().openapi({
		example: "統計データの取得に失敗しました",
		description: "エラーメッセージ",
	}),
});

/**
 * ダッシュボード統計取得のルート定義
 */
export const getDashboardStatsRoute = createRoute({
	method: "get",
	path: "/stats",
	request: {
		query: dashboardStatsOpenApiQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dashboardStatsOpenApiResponseSchema,
				},
			},
			description: "ダッシュボード統計データ",
		},
		500: {
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Dashboard"],
	summary: "ダッシュボード統計取得",
	description: "ダッシュボードで表示する詳細な統計データを取得します",
});
