import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

import { getDashboardOverview } from "./handlers/get-overview/get-overview";
import { getDashboardOverviewRoute } from "./handlers/get-overview/get-overview.openapi";
import { getDashboardStats } from "./handlers/get-stats/get-stats";
import { getDashboardStatsRoute } from "./handlers/get-stats/get-stats.openapi";
import { getViewsTrend } from "./handlers/get-views-trend/get-views-trend";
import { getViewsTrendRoute } from "./handlers/get-views-trend/get-views-trend.openapi";

/**
 * ダッシュボードAPIルート
 *
 * TypeScriptの型推論を正しく動作させるため、チェーンメソッドパターンを使用している。
 */
export const dashboardRoute = new OpenAPIHono<{ Bindings: Env }>()
	// GET /stats - ダッシュボード統計取得
	.openapi(getDashboardStatsRoute, getDashboardStats)
	// GET /overview - ダッシュボード概要取得
	.openapi(getDashboardOverviewRoute, getDashboardOverview)
	// GET /views-trend - 閲覧数推移取得
	.openapi(getViewsTrendRoute, getViewsTrend);
