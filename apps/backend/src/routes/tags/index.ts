import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

import { createTag } from "./handlers/create-tag/create-tag";
import { createTagRoute } from "./handlers/create-tag/create-tag.openapi";
import { deleteTag } from "./handlers/delete-tag/delete-tag";
import { deleteTagRoute } from "./handlers/delete-tag/delete-tag.openapi";
import { getAllTags } from "./handlers/get-all-tags/get-all-tags";
import { getAllTagsRoute } from "./handlers/get-all-tags/get-all-tags.openapi";
import { updateTag } from "./handlers/update-tag/update-tag";
import { updateTagRoute } from "./handlers/update-tag/update-tag.openapi";

/**
 * タグ関連のAPIルート
 *
 * TypeScriptの型推論を正しく動作させるため、チェーンメソッドパターンを使用している。
 */
export const tagsRoute = new OpenAPIHono<{ Bindings: Env }>()
	.openapi(getAllTagsRoute, getAllTags)
	.openapi(createTagRoute, createTag)
	.openapi(updateTagRoute, updateTag)
	.openapi(deleteTagRoute, deleteTag);
