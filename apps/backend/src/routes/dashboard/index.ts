import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	db,
	tags,
	tagTranslations,
} from "@saneatsu/db";
import {
	dashboardStatsQuerySchema,
	type DashboardOverviewResponse,
	type DashboardStatsResponse,
} from "@saneatsu/schemas/dist/dashboard";
import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";

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

const tagStatsOpenApiSchema = z.object({
	totalTags: z.number().int().openapi({
		example: 12,
		description: "総タグ数",
	}),
	topTags: z.array(z.object({
		id: z.number().int(),
		slug: z.string(),
		name: z.string(),
		articleCount: z.number().int(),
	})).openapi({
		example: [
			{ id: 1, slug: "javascript", name: "JavaScript", articleCount: 8 },
			{ id: 2, slug: "react", name: "React", articleCount: 6 },
		],
		description: "記事数が多いタグトップ5",
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
	tagStats: tagStatsOpenApiSchema,
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
	tagStats: tagStatsOpenApiSchema,
	topArticles: z.object({
		articles: z.array(popularArticleOpenApiSchema).max(5),
	}),
	recentActivities: z.object({
		activities: z.array(z.object({
			id: z.number().int(),
			type: z.enum(["article_created", "article_published", "article_updated", "tag_created"]),
			description: z.string(),
			entityId: z.number().int(),
			entityTitle: z.string(),
			createdAt: z.string().datetime(),
		})).max(20),
	}),
	lastUpdated: z.string().datetime(),
});

const app = new OpenAPIHono();

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

// @ts-ignore
app.openapi(getDashboardStatsRoute, async (c) => {
	try {
		const query = c.req.valid("query");
		const validated = dashboardStatsQuerySchema.parse(query);
		const { language, timeRange } = validated;

		// 現在日時と期間の計算
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
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
			db.select({ count: count() }).from(articles),
			// 公開済み記事数
			db.select({ count: count() }).from(articles).where(eq(articles.status, "published")),
			// 下書き記事数
			db.select({ count: count() }).from(articles).where(eq(articles.status, "draft")),
			// アーカイブ記事数
			db.select({ count: count() }).from(articles).where(eq(articles.status, "archived")),
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
			// 今月の閲覧数（複雑なクエリのため、とりあえず0で代用）
			Promise.resolve([{ thisMonthViews: 0 }]),
		]);

		// 2. タグ統計の取得
		const [totalTagsResult, topTagsResult] = await Promise.all([
			// 総タグ数
			db.select({ count: count() }).from(tags),
			// 記事数が多いタグトップ5
			db
				.select({
					id: tags.id,
					slug: tags.slug,
					name: tagTranslations.name,
					articleCount: count(articleTags.articleId),
				})
				.from(tags)
				.leftJoin(tagTranslations, eq(tags.id, tagTranslations.tagId))
				.leftJoin(articleTags, eq(tags.id, articleTags.tagId))
				.where(eq(tagTranslations.language, language))
				.groupBy(tags.id, tags.slug, tagTranslations.name)
				.orderBy(desc(count(articleTags.articleId)))
				.limit(5),
		]);

		// 3. 人気記事トップ10の取得
		const popularArticlesResult = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				title: articleTranslations.title,
				viewCount: articleTranslations.viewCount,
				publishedAt: articles.publishedAt,
			})
			.from(articles)
			.innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
			.where(
				and(
					eq(articleTranslations.language, language),
					eq(articles.status, "published")
				)
			)
			.orderBy(desc(articleTranslations.viewCount))
			.limit(10);

		// 4. 時系列統計（簡易版：過去30日間の記事作成数）
		const dailyStatsResult = await db
			.select({
				date: sql`DATE(created_at)`.as("date"),
				articlesCreated: count(),
				views: sql`0`.as("views"), // 簡易版：閲覧数は0で固定
			})
			.from(articles)
			.where(gte(articles.createdAt, timeRangeStart.toISOString()))
			.groupBy(sql`DATE(created_at)`)
			.orderBy(sql`DATE(created_at)`);

		// レスポンスデータの構築
		const response: DashboardStatsResponse = {
			articleStats: {
				totalArticles: totalArticlesResult[0]?.count || 0,
				publishedArticles: publishedArticlesResult[0]?.count || 0,
				draftArticles: draftArticlesResult[0]?.count || 0,
				archivedArticles: archivedArticlesResult[0]?.count || 0,
				thisMonthArticles: thisMonthArticlesResult[0]?.count || 0,
				totalViews: Number(totalViewsResult[0]?.totalViews) || 0,
				thisMonthViews: thisMonthViewsResult[0]?.thisMonthViews || 0,
			},
			tagStats: {
				totalTags: totalTagsResult[0]?.count || 0,
				topTags: topTagsResult.map((tag) => ({
					id: tag.id,
					slug: tag.slug,
					name: tag.name || "",
					articleCount: tag.articleCount,
				})),
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

// @ts-ignore  
app.openapi(getDashboardOverviewRoute, async (c) => {
	try {
		const query = c.req.valid("query");
		const language = query.language || "ja";

		// 現在日時
		const now = new Date();

		// 1. 記事統計の取得（概要版）
		const [
			totalArticlesResult,
			publishedArticlesResult,
			draftArticlesResult,
			archivedArticlesResult,
		] = await Promise.all([
			db.select({ count: count() }).from(articles),
			db.select({ count: count() }).from(articles).where(eq(articles.status, "published")),
			db.select({ count: count() }).from(articles).where(eq(articles.status, "draft")),
			db.select({ count: count() }).from(articles).where(eq(articles.status, "archived")),
		]);

		// 総閲覧数
		const totalViewsResult = await db
			.select({ totalViews: sql`COALESCE(SUM(view_count), 0)` })
			.from(articleTranslations)
			.where(eq(articleTranslations.language, language));

		// 2. タグ統計（概要版）
		const [totalTagsResult, topTagsResult] = await Promise.all([
			db.select({ count: count() }).from(tags),
			db
				.select({
					id: tags.id,
					slug: tags.slug,
					name: tagTranslations.name,
					articleCount: count(articleTags.articleId),
				})
				.from(tags)
				.leftJoin(tagTranslations, eq(tags.id, tagTranslations.tagId))
				.leftJoin(articleTags, eq(tags.id, articleTags.tagId))
				.where(eq(tagTranslations.language, language))
				.groupBy(tags.id, tags.slug, tagTranslations.name)
				.orderBy(desc(count(articleTags.articleId)))
				.limit(5),
		]);

		// 3. 人気記事トップ5
		const topArticlesResult = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				title: articleTranslations.title,
				viewCount: articleTranslations.viewCount,
				publishedAt: articles.publishedAt,
			})
			.from(articles)
			.innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
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
			.innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
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
				thisMonthViews: 0, // 概要版では省略
			},
			tagStats: {
				totalTags: totalTagsResult[0]?.count || 0,
				topTags: topTagsResult.map((tag) => ({
					id: tag.id,
					slug: tag.slug,
					name: tag.name || "",
					articleCount: tag.articleCount,
				})),
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
					type: activity.type as any,
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

export const dashboardRoute = app;