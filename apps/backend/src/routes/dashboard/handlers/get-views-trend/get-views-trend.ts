import type { RouteHandler } from "@hono/zod-openapi";
import type { ViewsTrendResponse } from "@saneatsu/schemas";
import { viewsTrendQuerySchema } from "@saneatsu/schemas";
import { and, gte, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import type { Env } from "@/types/env";

import type { getViewsTrendRoute } from "./get-views-trend.openapi";

type Handler = RouteHandler<typeof getViewsTrendRoute, { Bindings: Env }>;

/**
 * GET /api/dashboard/views-trend - 閲覧数推移取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. クエリパラメータをバリデーション
 * 3. 期間内の日別閲覧数を取得
 * 4. 完全な日付範囲のデータを生成（欠けている日付は0で埋める）
 * 5. レスポンスを返す
 */
export const getViewsTrend: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, dailyArticleViews } = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. クエリパラメータをバリデーション
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

		// 3. 期間内の日別閲覧数を取得
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

		// 4. 完全な日付範囲のデータを生成（欠けている日付は0で埋める）
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

		// 5. レスポンスを返す
		const response: ViewsTrendResponse = {
			data,
			startDate: startDateStr,
			endDate: endDateStr,
			totalViews,
			lastUpdated: now.toISOString(),
		};

		return c.json(response, 200);
	} catch (error) {
		console.error("閲覧数推移取得エラー:", error);
		return c.json({ error: "閲覧数推移データの取得に失敗しました" }, 500);
	}
};
