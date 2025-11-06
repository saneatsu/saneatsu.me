import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import type { Env } from "@/env";
import { deleteImage, getDatabase } from "@/lib";

import type { deleteGalleryImageRoute } from "./delete-gallery-image.openapi";

type Handler = RouteHandler<typeof deleteGalleryImageRoute, { Bindings: Env }>;

/**
 * DELETE /api/gallery/images/:id - ギャラリー画像削除
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータから画像IDを取得
 * 3. 画像の存在確認と cfImageId の取得
 * 4. Cloudflare Imagesから画像を削除
 * 5. DBから画像レコードを削除
 * 6. レスポンスを返す
 */
export const deleteGalleryImageHandler: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, galleryImages } = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. パスパラメータから画像IDを取得
		const { id } = c.req.valid("param");
		const imageId = Number.parseInt(id, 10);

		if (Number.isNaN(imageId)) {
			return c.json(
				{
					error: {
						code: "INVALID_ID",
						message: "画像IDは数値で指定してください。",
					},
				},
				400
			);
		}

		// 3. 画像の存在確認と cfImageId の取得
		const [existingImage] = await db
			.select()
			.from(galleryImages)
			.where(eq(galleryImages.id, imageId))
			.limit(1);

		if (!existingImage) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "指定されたギャラリー画像が見つかりませんでした。",
					},
				},
				404
			);
		}

		// 4. Cloudflare Imagesから画像を削除
		try {
			await deleteImage(existingImage.cfImageId, {
				CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
				CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
			});
		} catch (error) {
			console.error(
				`Failed to delete image from Cloudflare: ${existingImage.cfImageId}`,
				error
			);
			// Cloudflare Imagesからの削除に失敗してもDBからは削除する
			// （孤立したレコードを防ぐため）
		}

		// 5. DBから画像レコードを削除
		await db.delete(galleryImages).where(eq(galleryImages.id, imageId));

		// 6. レスポンスを返す
		return c.json(
			{
				message: "ギャラリー画像が正常に削除されました",
			},
			200
		);
	} catch (error) {
		console.error("Error deleting gallery image:", error);
		return c.json(
			{
				error: {
					code: "DELETE_FAILED",
					message: "ギャラリー画像の削除に失敗しました",
				},
			},
			500
		);
	}
};
