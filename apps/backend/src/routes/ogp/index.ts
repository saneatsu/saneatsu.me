import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

import { getOgp } from "./handlers/get-ogp/get-ogp";
import { getOgpRoute } from "./handlers/get-ogp/get-ogp.openapi";

/**
 * OGP関連のAPIルート
 */
export const ogpRoute = new OpenAPIHono<{ Bindings: Env }>()
	// OGP情報取得
	.openapi(getOgpRoute, getOgp);
