import { OpenAPIHono } from "@hono/zod-openapi";

import { getAllTags } from "./handlers/get-all-tags/get-all-tags";
import { getAllTagsRoute } from "./handlers/get-all-tags/get-all-tags.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
};

/**
 * タグ関連のAPIルート
 */
export const tagsRoute = new OpenAPIHono<{ Bindings: Env }>();

tagsRoute.openapi(getAllTagsRoute, getAllTags);
