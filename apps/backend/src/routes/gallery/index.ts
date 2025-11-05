import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

// ハンドラーをimport
import { deleteGalleryImageHandler } from "./handlers/delete-gallery-image/delete-gallery-image";
// ルート定義をimport
import { deleteGalleryImageRoute } from "./handlers/delete-gallery-image/delete-gallery-image.openapi";
import { getArticlesByGalleryImageHandler } from "./handlers/get-articles-by-gallery-image/get-articles-by-gallery-image";
import { getArticlesByGalleryImageRoute } from "./handlers/get-articles-by-gallery-image/get-articles-by-gallery-image.openapi";
import { getGalleryImageByIdHandler } from "./handlers/get-gallery-image-by-id/get-gallery-image-by-id";
import { getGalleryImageByIdRoute } from "./handlers/get-gallery-image-by-id/get-gallery-image-by-id.openapi";
import { getGalleryImagesHandler } from "./handlers/get-gallery-images/get-gallery-images";
import { getGalleryImagesRoute } from "./handlers/get-gallery-images/get-gallery-images.openapi";
import { updateGalleryImageHandler } from "./handlers/update-gallery-image/update-gallery-image";
import { updateGalleryImageRoute } from "./handlers/update-gallery-image/update-gallery-image.openapi";
import { uploadGalleryImageHandler } from "./handlers/upload-gallery-image/upload-gallery-image";
import { uploadGalleryImageRoute } from "./handlers/upload-gallery-image/upload-gallery-image.openapi";

/**
 * ギャラリー関連のAPIルート
 */
export const galleryRoute = new OpenAPIHono<{ Bindings: Env }>()
	// ギャラリー画像一覧取得
	.openapi(getGalleryImagesRoute, getGalleryImagesHandler)
	// ギャラリー画像詳細取得
	.openapi(getGalleryImageByIdRoute, getGalleryImageByIdHandler)
	// ギャラリー画像を使用している記事一覧取得
	.openapi(getArticlesByGalleryImageRoute, getArticlesByGalleryImageHandler)
	// ギャラリー画像アップロード
	.openapi(uploadGalleryImageRoute, uploadGalleryImageHandler)
	// ギャラリー画像更新
	.openapi(updateGalleryImageRoute, updateGalleryImageHandler)
	// ギャラリー画像削除
	.openapi(deleteGalleryImageRoute, deleteGalleryImageHandler);
