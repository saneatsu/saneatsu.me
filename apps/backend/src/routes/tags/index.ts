import { OpenAPIHono } from "@hono/zod-openapi";

import { createTag } from "./handlers/create-tag/create-tag";
import { createTagRoute } from "./handlers/create-tag/create-tag.openapi";
import { deleteTag } from "./handlers/delete-tag/delete-tag";
import { deleteTagRoute } from "./handlers/delete-tag/delete-tag.openapi";
import { getAllTags } from "./handlers/get-all-tags/get-all-tags";
import { getAllTagsRoute } from "./handlers/get-all-tags/get-all-tags.openapi";
import { updateTag } from "./handlers/update-tag/update-tag";
import { updateTagRoute } from "./handlers/update-tag/update-tag.openapi";

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
tagsRoute.openapi(createTagRoute, createTag);
tagsRoute.openapi(updateTagRoute, updateTag);
tagsRoute.openapi(deleteTagRoute, deleteTag);
