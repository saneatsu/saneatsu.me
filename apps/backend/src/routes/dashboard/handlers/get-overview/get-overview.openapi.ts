import { createRoute, z } from "@hono/zod-openapi";

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
 * 人気記事用タグスキーマ
 */
const popularArticleTagOpenApiSchema = z.object({
	id: z.number().int(),
	translations: z.object({
		ja: z.string(),
		en: z.string(),
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
	cfImageId: z.string().nullable(),
	updatedAt: z.string().nullable(),
	tags: z.array(popularArticleTagOpenApiSchema),
});

/**
 * ダッシュボード概要レスポンススキーマ
 */
const dashboardOverviewOpenApiResponseSchema = z.object({
	articleStats: articleStatsOpenApiSchema,
	topArticles: z.object({
		articles: z.array(popularArticleOpenApiSchema).max(5),
	}),
	recentActivities: z.object({
		activities: z
			.array(
				z.object({
					id: z.number().int(),
					type: z.enum([
						"article_created",
						"article_published",
						"article_updated",
					]),
					description: z.string(),
					entityId: z.number().int(),
					entityTitle: z.string(),
					createdAt: z.string().datetime(),
				})
			)
			.max(20),
	}),
	contributions: z.object({
		startDate: z.string().openapi({ example: "2025-01-01" }),
		endDate: z.string().openapi({ example: "2025-12-31" }),
		totalUpdates: z.number().int().openapi({ example: 120 }),
		totalJaChars: z.number().int().openapi({ example: 54000 }),
		maxUpdates: z.number().int().openapi({ example: 6 }),
		maxJaChars: z.number().int().openapi({ example: 3200 }),
		days: z
			.array(
				z.object({
					date: z.string(),
					updates: z.number().int(),
					jaChars: z.number().int(),
				})
			)
			.max(366),
		lastUpdated: z.string().datetime(),
	}),
	lastUpdated: z.string().datetime(),
});

/**
 * エラースキーマ
 */
const errorSchema = z.object({
	error: z.string().openapi({
		example: "概要データの取得に失敗しました",
		description: "エラーメッセージ",
	}),
});

/**
 * ダッシュボード概要取得のルート定義
 */
export const getDashboardOverviewRoute = createRoute({
	method: "get",
	path: "/overview",
	request: {
		query: z.object({
			language: z.enum(["ja", "en"]).optional().openapi({
				example: "ja",
				description: "統計データを取得する言語",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dashboardOverviewOpenApiResponseSchema,
				},
			},
			description: "ダッシュボード概要データ",
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
	summary: "ダッシュボード概要取得",
	description: "ダッシュボードトップページで表示する概要統計データを取得します",
});
