import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/types/env";

import { getDashboardOverview } from "./handlers/get-overview/get-overview";
import { getDashboardOverviewRoute } from "./handlers/get-overview/get-overview.openapi";
import { getDashboardStats } from "./handlers/get-stats/get-stats";
import { getDashboardStatsRoute } from "./handlers/get-stats/get-stats.openapi";
import { getViewsTrend } from "./handlers/get-views-trend/get-views-trend";
import { getViewsTrendRoute } from "./handlers/get-views-trend/get-views-trend.openapi";

const app = new OpenAPIHono<{ Bindings: Env }>();

/**
 * ダッシュボードAPIルート
 */
app
	// GET /stats - ダッシュボード統計取得
	.openapi(getDashboardStatsRoute, getDashboardStats)
	// GET /overview - ダッシュボード概要取得
	.openapi(getDashboardOverviewRoute, getDashboardOverview)
	// GET /views-trend - 閲覧数推移取得
	.openapi(getViewsTrendRoute, getViewsTrend);

export const dashboardRoute = app;
