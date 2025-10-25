import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

// ハンドラーをimport
import { deleteImageHandler } from "./handlers/delete-image/delete-image";
// ルート定義をimport
import { deleteImageRoute } from "./handlers/delete-image/delete-image.openapi";
import { uploadImageHandler } from "./handlers/upload-image/upload-image";
import { uploadImageRoute } from "./handlers/upload-image/upload-image.openapi";

/**
 * 画像関連のAPIルート
 */
export const imagesRoute = new OpenAPIHono<{ Bindings: Env }>()
	// 汎用画像アップロード
	.openapi(uploadImageRoute, uploadImageHandler)
	// 汎用画像削除
	.openapi(deleteImageRoute, deleteImageHandler);
