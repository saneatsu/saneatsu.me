import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	type DashboardOverviewResponse,
	type DashboardStatsResponse,
	dashboardStatsQuerySchema,
	type ViewsTrendResponse,
	viewsTrendQuerySchema,
} from "@saneatsu/schemas";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";

// OpenAPI用のクエリスキーマ（packages/schemasをOpenAPI対応でラップ）
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

// OpenAPI用のレスポンススキーマ
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

const popularArticleOpenApiSchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	title: z.string(),
	viewCount: z.number().int(),
	publishedAt: z.string().nullable(),
});

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
	lastUpdated: z.string().datetime(),
});

// 閲覧数推移用のOpenAPIスキーマ
const viewsTrendOpenApiQuerySchema = z.object({
	language: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "統計データを取得する言語",
	}),
	days: z.string().optional().openapi({
		example: "30",
		description: "表示期間（30、90、180、360日）",
	}),
});

const viewsTrendDataPointOpenApiSchema = z.object({
	date: z.string().openapi({
		example: "2024-01-15",
		description: "日付（YYYY-MM-DD形式）",
	}),
	views: z.number().int().openapi({
		example: 156,
		description: "その日の総閲覧数",
	}),
});

const viewsTrendOpenApiResponseSchema = z.object({
	data: z.array(viewsTrendDataPointOpenApiSchema).openapi({
		description: "指定期間の日別閲覧数データ",
	}),
	startDate: z.string().openapi({
		example: "2024-01-01",
		description: "データの開始日",
	}),
	endDate: z.string().openapi({
		example: "2024-01-31",
		description: "データの終了日",
	}),
	totalViews: z.number().int().openapi({
		example: 4567,
		description: "期間中の総閲覧数",
	}),
	lastUpdated: z.string().datetime().openapi({
		example: "2024-01-31T12:00:00Z",
		description: "統計の最終更新日時",
	}),
});

// Cloudflare Workers環境の型定義
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	ENVIRONMENT?: string; // 環境識別子（development, preview, production）
};

const app = new OpenAPIHono<{ Bindings: Env }>();

/**
 * ダッシュボード統計取得API
 * 詳細な統計データ（記事統計、タグ統計、人気記事、時系列データ）を取得
 */
const getDashboardStatsRoute = createRoute({
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
	},
	tags: ["Dashboard"],
	summary: "ダッシュボード統計取得",
	description: "ダッシュボードで表示する詳細な統計データを取得します",
});

/**
 * ダッシュボード概要取得API
 * トップページ用の概要統計データを取得
 */
const getDashboardOverviewRoute = createRoute({
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
	},
	tags: ["Dashboard"],
	summary: "ダッシュボード概要取得",
	description: "ダッシュボードトップページで表示する概要統計データを取得します",
});

// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
app.openapi(getDashboardStatsRoute, async (c) => {
	try {
		// DBクライアントを作成（環境に応じて適切なクライアントを使用）
		const {
			createDatabaseClient,
			articles,
			articleTranslations,
			dailyArticleViews,
		} = await getDatabase();
		const db = createDatabaseClient(c.env);

		const query = c.req.valid("query");
		const validated = dashboardStatsQuerySchema.parse(query);
		const { language, timeRange } = validated;

		// 現在日時と期間の計算
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
		const timeRangeStart = new Date(now);
		timeRangeStart.setDate(now.getDate() - timeRange);

		// 1. 記事統計の取得
		const [
			totalArticlesResult,
			publishedArticlesResult,
			draftArticlesResult,
			archivedArticlesResult,
			thisMonthArticlesResult,
		] = await Promise.all([
			// 総記事数
			db
				.select({ count: count() })
				.from(articles),
			// 公開済み記事数
			db
				.select({ count: count() })
				.from(articles)
				.where(eq(articles.status, "published")),
			// 下書き記事数
			db
				.select({ count: count() })
				.from(articles)
				.where(eq(articles.status, "draft")),
			// アーカイブ記事数
			db
				.select({ count: count() })
				.from(articles)
				.where(eq(articles.status, "archived")),
			// 今月の新規作成記事数
			db
				.select({ count: count() })
				.from(articles)
				.where(gte(articles.createdAt, startOfMonth.toISOString())),
		]);

		// 閲覧数統計
		const [totalViewsResult, thisMonthViewsResult] = await Promise.all([
			// 総閲覧数（指定言語）
			db
				.select({ totalViews: sql`COALESCE(SUM(view_count), 0)` })
				.from(articleTranslations)
				.where(eq(articleTranslations.language, language)),
			// 今月の閲覧数（daily_article_viewsから集計）
			db
				.select({
					thisMonthViews: sql`COALESCE(SUM(view_count), 0)`,
				})
				.from(dailyArticleViews)
				.where(gte(dailyArticleViews.date, startOfMonthStr)),
		]);

		// 2. 人気記事トップ10の取得
		const popularArticlesResult = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				title: articleTranslations.title,
				viewCount: articleTranslations.viewCount,
				publishedAt: articles.publishedAt,
			})
			.from(articles)
			.innerJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(
				and(
					eq(articleTranslations.language, language),
					eq(articles.status, "published")
				)
			)
			.orderBy(desc(articleTranslations.viewCount))
			.limit(10);

		// 4. 時系列統計（記事作成数と日別閲覧数）
		const timeRangeStartStr = timeRangeStart.toISOString().split("T")[0];
		const nowStr = now.toISOString().split("T")[0];

		// 記事作成数を取得
		const articlesCreatedResult = await db
			.select({
				date: sql`DATE(created_at)`.as("date"),
				articlesCreated: count(),
			})
			.from(articles)
			.where(gte(articles.createdAt, timeRangeStart.toISOString()))
			.groupBy(sql`DATE(created_at)`)
			.orderBy(sql`DATE(created_at)`);

		// 日別閲覧数を取得
		const dailyViewsResult = await db
			.select({
				date: dailyArticleViews.date,
				views: dailyArticleViews.viewCount,
			})
			.from(dailyArticleViews)
			.where(
				and(
					gte(dailyArticleViews.date, timeRangeStartStr),
					sql`${dailyArticleViews.date} <= ${nowStr}`
				)
			)
			.orderBy(dailyArticleViews.date);

		// データを統合（日付ごとにマージ）
		const dateMap = new Map<
			string,
			{ articlesCreated: number; views: number }
		>();

		// 記事作成数を追加
		for (const row of articlesCreatedResult) {
			const dateStr = row.date as string;
			dateMap.set(dateStr, {
				articlesCreated: row.articlesCreated,
				views: 0,
			});
		}

		// 閲覧数を追加
		for (const row of dailyViewsResult) {
			const existing = dateMap.get(row.date);
			if (existing) {
				existing.views = row.views;
			} else {
				dateMap.set(row.date, {
					articlesCreated: 0,
					views: row.views,
				});
			}
		}

		// 完全な日付範囲のデータを生成
		const dailyStatsResult: Array<{
			date: string;
			articlesCreated: number;
			views: number;
		}> = [];
		const currentDate = new Date(timeRangeStart);
		const endDate = new Date(now);

		while (currentDate <= endDate) {
			const dateStr = currentDate.toISOString().split("T")[0];
			const data = dateMap.get(dateStr);
			dailyStatsResult.push({
				date: dateStr,
				articlesCreated: data?.articlesCreated || 0,
				views: data?.views || 0,
			});
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// レスポンスデータの構築
		const response: DashboardStatsResponse = {
			articleStats: {
				totalArticles: totalArticlesResult[0]?.count || 0,
				publishedArticles: publishedArticlesResult[0]?.count || 0,
				draftArticles: draftArticlesResult[0]?.count || 0,
				archivedArticles: archivedArticlesResult[0]?.count || 0,
				thisMonthArticles: thisMonthArticlesResult[0]?.count || 0,
				totalViews: Number(totalViewsResult[0]?.totalViews) || 0,
				thisMonthViews: Number(thisMonthViewsResult[0]?.thisMonthViews) || 0,
			},
			popularArticles: {
				articles: popularArticlesResult.map((article) => ({
					id: article.id,
					slug: article.slug,
					title: article.title,
					viewCount: article.viewCount,
					publishedAt: article.publishedAt,
				})),
			},
			timeSeriesStats: {
				last30Days: dailyStatsResult.map((stat) => ({
					date: stat.date as string,
					articlesCreated: stat.articlesCreated,
					views: Number(stat.views),
				})),
			},
			lastUpdated: now.toISOString(),
		};

		return c.json(response);
	} catch (error) {
		console.error("ダッシュボード統計取得エラー:", error);
		return c.json({ error: "統計データの取得に失敗しました" }, 500);
	}
});

// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
app.openapi(getDashboardOverviewRoute, async (c) => {
	try {
		// DBクライアントを作成（環境に応じて適切なクライアントを使用）
		const {
			createDatabaseClient,
			articles,
			articleTranslations,
			dailyArticleViews,
		} = await getDatabase();
		const db = createDatabaseClient(c.env);

		const query = c.req.valid("query");
		const language = query.language || "ja";

		// 現在日時
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

		// 1. 記事統計の取得（概要版）
		const [
			totalArticlesResult,
			publishedArticlesResult,
			draftArticlesResult,
			archivedArticlesResult,
		] = await Promise.all([
			db.select({ count: count() }).from(articles),
			db
				.select({ count: count() })
				.from(articles)
				.where(eq(articles.status, "published")),
			db
				.select({ count: count() })
				.from(articles)
				.where(eq(articles.status, "draft")),
			db
				.select({ count: count() })
				.from(articles)
				.where(eq(articles.status, "archived")),
		]);

		// 閲覧数統計
		const [totalViewsResult, thisMonthViewsResult] = await Promise.all([
			// 総閲覧数
			db
				.select({ totalViews: sql`COALESCE(SUM(view_count), 0)` })
				.from(articleTranslations)
				.where(eq(articleTranslations.language, language)),
			// 今月の閲覧数
			db
				.select({
					thisMonthViews: sql`COALESCE(SUM(view_count), 0)`,
				})
				.from(dailyArticleViews)
				.where(gte(dailyArticleViews.date, startOfMonthStr)),
		]);

		// 2. 人気記事トップ5
		const topArticlesResult = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				title: articleTranslations.title,
				viewCount: articleTranslations.viewCount,
				publishedAt: articles.publishedAt,
			})
			.from(articles)
			.innerJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(
				and(
					eq(articleTranslations.language, language),
					eq(articles.status, "published")
				)
			)
			.orderBy(desc(articleTranslations.viewCount))
			.limit(5);

		// 4. 最近の活動（簡易版：最近作成された記事）
		const recentActivitiesResult = await db
			.select({
				id: articles.id,
				type: sql`'article_created'`.as("type"),
				description: sql`'記事が作成されました'`.as("description"),
				entityId: articles.id,
				entityTitle: articleTranslations.title,
				createdAt: articles.createdAt,
			})
			.from(articles)
			.innerJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(eq(articleTranslations.language, language))
			.orderBy(desc(articles.createdAt))
			.limit(20);

		// レスポンスデータの構築
		const response: DashboardOverviewResponse = {
			articleStats: {
				totalArticles: totalArticlesResult[0]?.count || 0,
				publishedArticles: publishedArticlesResult[0]?.count || 0,
				draftArticles: draftArticlesResult[0]?.count || 0,
				archivedArticles: archivedArticlesResult[0]?.count || 0,
				thisMonthArticles: 0, // 概要版では省略
				totalViews: Number(totalViewsResult[0]?.totalViews) || 0,
				thisMonthViews: Number(thisMonthViewsResult[0]?.thisMonthViews) || 0,
			},
			topArticles: {
				articles: topArticlesResult.map((article) => ({
					id: article.id,
					slug: article.slug,
					title: article.title,
					viewCount: article.viewCount,
					publishedAt: article.publishedAt,
				})),
			},
			recentActivities: {
				activities: recentActivitiesResult.map((activity) => ({
					id: activity.id,
					type: activity.type as
						| "article_created"
						| "article_published"
						| "article_updated",
					description: activity.description as string,
					entityId: activity.entityId,
					entityTitle: activity.entityTitle,
					createdAt: activity.createdAt,
				})),
			},
			lastUpdated: now.toISOString(),
		};

		return c.json(response);
	} catch (error) {
		console.error("ダッシュボード概要取得エラー:", error);
		return c.json({ error: "概要データの取得に失敗しました" }, 500);
	}
});

/**
 * 閲覧数推移取得のルート定義
 */
const getViewsTrendRoute = createRoute({
	method: "get",
	path: "/views-trend",
	request: {
		query: viewsTrendOpenApiQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: viewsTrendOpenApiResponseSchema,
				},
			},
			description: "閲覧数推移データ",
		},
		500: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Dashboard"],
	summary: "閲覧数推移取得",
	description: "指定期間の日別閲覧数推移を取得します",
});

/**
 * GET /api/dashboard/views-trend - 閲覧数推移取得
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
app.openapi(getViewsTrendRoute, async (c) => {
	try {
		// DBクライアントを作成
		const { createDatabaseClient, dailyArticleViews } = await getDatabase();
		const db = createDatabaseClient(c.env);

		const query = c.req.valid("query");
		const validated = viewsTrendQuerySchema.parse(query);
		const { days } = validated;

		// 現在日時と開始日の計算
		const now = new Date();
		const endDate = new Date(now);
		endDate.setHours(23, 59, 59, 999);

		const startDate = new Date(now);
		startDate.setDate(now.getDate() - days + 1);
		startDate.setHours(0, 0, 0, 0);

		const startDateStr = startDate.toISOString().split("T")[0];
		const endDateStr = endDate.toISOString().split("T")[0];

		// 期間内の日別閲覧数を取得
		const dailyViewsResult = await db
			.select({
				date: dailyArticleViews.date,
				viewCount: dailyArticleViews.viewCount,
			})
			.from(dailyArticleViews)
			.where(
				and(
					gte(dailyArticleViews.date, startDateStr),
					sql`${dailyArticleViews.date} <= ${endDateStr}`
				)
			)
			.orderBy(dailyArticleViews.date);

		// 日別閲覧数をMapに格納
		const dateMap = new Map<string, number>();
		for (const row of dailyViewsResult) {
			dateMap.set(row.date, row.viewCount);
		}

		// 完全な日付範囲のデータを生成（欠けている日付は0で埋める）
		const data: Array<{ date: string; views: number }> = [];
		let totalViews = 0;
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			const dateStr = currentDate.toISOString().split("T")[0];
			const views = dateMap.get(dateStr) || 0;
			data.push({ date: dateStr, views });
			totalViews += views;
			currentDate.setDate(currentDate.getDate() + 1);
		}

		const response: ViewsTrendResponse = {
			data,
			startDate: startDateStr,
			endDate: endDateStr,
			totalViews,
			lastUpdated: now.toISOString(),
		};

		return c.json(response);
	} catch (error) {
		console.error("閲覧数推移取得エラー:", error);
		return c.json({ error: "閲覧数推移データの取得に失敗しました" }, 500);
	}
});

export const dashboardRoute = app;
