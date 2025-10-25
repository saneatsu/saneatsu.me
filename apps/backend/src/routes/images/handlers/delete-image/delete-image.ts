import type { RouteHandler } from "@hono/zod-openapi";
import type { Env } from "@/env";
import { deleteImage } from "@/lib";

import type { deleteImageRoute } from "./delete-image.openapi";

type Handler = RouteHandler<typeof deleteImageRoute, { Bindings: Env }>;

/**
 * DELETE /api/images/:imageId - 汎用画像削除
 *
 * @description
 * 処理フロー:
 * 1. パスパラメータからimageIdを取得
 * 2. Cloudflare Imagesから画像を削除
 * 3. レスポンスを返す
 */
export const deleteImageHandler: Handler = async (c) => {
	try {
		// 1. パスパラメータからimageIdを取得
		const { imageId } = c.req.valid("param");

		// 2. Cloudflare Imagesから画像を削除
		await deleteImage(imageId, {
			CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
			CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
		});

		// 3. レスポンスを返す
		return c.json(
			{
				message: "画像が正常に削除されました",
			},
			200
		);
	} catch (error) {
		console.error("Error deleting image:", error);
		return c.json(
			{
				error: {
					code: "DELETE_FAILED",
					message: "画像の削除に失敗しました",
				},
			},
			500
		);
	}
};
