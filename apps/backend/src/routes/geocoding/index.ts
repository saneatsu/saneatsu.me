import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

// ハンドラーをimport
import { searchGeocodingHandler } from "./handlers/search-geocoding/search-geocoding";
// ルート定義をimport
import { searchGeocodingRoute } from "./handlers/search-geocoding/search-geocoding.openapi";

/**
 * Geocoding関連のAPIルート
 */
export const geocodingRoute = new OpenAPIHono<{ Bindings: Env }>()
	// 住所から座標を検索
	.openapi(searchGeocodingRoute, searchGeocodingHandler);
