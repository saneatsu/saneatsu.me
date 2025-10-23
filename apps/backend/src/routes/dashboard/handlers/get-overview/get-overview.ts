import type { RouteHandler } from "@hono/zod-openapi";
import type { DashboardOverviewResponse } from "@saneatsu/schemas";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";

import type { getDashboardOverviewRoute } from "./get-overview.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	ENVIRONMENT?: string;
};

type Handler = RouteHandler<
	typeof getDashboardOverviewRoute,
	{ Bindings: Env }
>;

/**
 * GET /api/dashboard/overview - ダッシュボード概要取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. クエリパラメータを取得
 * 3. 記事統計を取得（概要版）
 * 4. 閲覧数統計を取得
 * 5. 人気記事トップ5を取得
 * 6. 最近の活動を取得
 * 7. レスポンスを返す
 */
export const getDashboardOverview: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成（環境に応じて適切なクライアントを使用）
		const {
			createDatabaseClient,
			articles,
			articleTranslations,
			dailyArticleViews,
		} = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. クエリパラメータを取得
		const query = c.req.valid("query");
		const language = query.language || "ja";

		// 現在日時
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

		// 3. 記事統計の取得（概要版）
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

		// 4. 閲覧数統計
		const [totalViewsResult, thisMonthViewsResult] = await Promise.all([
			// 総閲覧数
			db
				.select({ totalViews: sql`COALESCE(SUM(view_count), 0)` })
				.from(articles),
			// 今月の閲覧数
			db
				.select({
					thisMonthViews: sql`COALESCE(SUM(view_count), 0)`,
				})
				.from(dailyArticleViews)
				.where(gte(dailyArticleViews.date, startOfMonthStr)),
		]);

		// 5. 人気記事トップ5
		const topArticlesResult = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				title: articleTranslations.title,
				viewCount: articles.viewCount,
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
			.orderBy(desc(articles.viewCount))
			.limit(5);

		// 6. 最近の活動（簡易版：最近作成された記事）
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

		// 7. レスポンスデータの構築
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

		return c.json(response, 200);
	} catch (error) {
		console.error("ダッシュボード概要取得エラー:", error);
		return c.json({ error: "概要データの取得に失敗しました" }, 500);
	}
};
