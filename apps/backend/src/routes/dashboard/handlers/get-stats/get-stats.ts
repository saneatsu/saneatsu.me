import type { RouteHandler } from "@hono/zod-openapi";
import type { DashboardStatsResponse } from "@saneatsu/schemas";
import { dashboardStatsQuerySchema } from "@saneatsu/schemas";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import type { Env } from "@/env";
import { getDatabase } from "@/lib/database";

import type { getDashboardStatsRoute } from "./get-stats.openapi";

type Handler = RouteHandler<typeof getDashboardStatsRoute, { Bindings: Env }>;

/**
 * GET /api/dashboard/stats - ダッシュボード統計取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. クエリパラメータをバリデーション
 * 3. 記事統計を取得（総記事数、公開済み、下書き、アーカイブ、今月の新規作成）
 * 4. 閲覧数統計を取得（総閲覧数、今月の閲覧数）
 * 5. 人気記事トップ10を取得
 * 6. 時系列統計を取得（記事作成数と日別閲覧数）
 * 7. レスポンスを返す
 */
export const getDashboardStats: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成（環境に応じて適切なクライアントを使用）
		const {
			createDatabaseClient,
			articles,
			articleTranslations,
			dailyArticleViews,
		} = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. クエリパラメータをバリデーション
		const query = c.req.valid("query");
		const validated = dashboardStatsQuerySchema.parse(query);
		const { language, timeRange } = validated;

		// 現在日時と期間の計算
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
		const timeRangeStart = new Date(now);
		timeRangeStart.setDate(now.getDate() - timeRange);

		// 3. 記事統計の取得
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

		// 4. 閲覧数統計
		const [totalViewsResult, thisMonthViewsResult] = await Promise.all([
			// 総閲覧数
			db
				.select({ totalViews: sql`COALESCE(SUM(view_count), 0)` })
				.from(articles),
			// 今月の閲覧数（daily_article_viewsから集計）
			db
				.select({
					thisMonthViews: sql`COALESCE(SUM(view_count), 0)`,
				})
				.from(dailyArticleViews)
				.where(gte(dailyArticleViews.date, startOfMonthStr)),
		]);

		// 5. 人気記事トップ10の取得
		const popularArticlesResult = await db
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
			.limit(10);

		// 6. 時系列統計（記事作成数と日別閲覧数）
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

		// 7. レスポンスデータの構築
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

		return c.json(response, 200);
	} catch (error) {
		console.error("ダッシュボード統計取得エラー:", error);
		return c.json({ error: "統計データの取得に失敗しました" }, 500);
	}
};
