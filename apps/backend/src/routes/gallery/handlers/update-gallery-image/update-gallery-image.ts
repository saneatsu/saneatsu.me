import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { updateGalleryImageRoute } from "./update-gallery-image.openapi";

type Handler = RouteHandler<typeof updateGalleryImageRoute, { Bindings: Env }>;

/**
 * PATCH /api/gallery/images/:id - ギャラリー画像更新
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータから画像IDを取得
 * 3. リクエストボディを取得
 * 4. 画像の存在確認
 * 5. 更新データを構築（latitude, longitude, takenAt, status）
 * 6. 画像情報を更新（gallery_images）
 * 7. 翻訳データの更新（gallery_image_translations、指定されている場合）
 *    - 既存の翻訳は上書き、新しい言語は追加
 * 8. 更新後の画像情報を取得
 * 9. 翻訳データを取得
 * 10. レスポンスを返す
 */
export const updateGalleryImageHandler: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, galleryImages, galleryImageTranslations } =
			await getDatabase();
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

		// 3. リクエストボディを取得
		const body = c.req.valid("json");

		// 4. 画像の存在確認
		const existingImage = await db
			.select()
			.from(galleryImages)
			.where(eq(galleryImages.id, imageId))
			.limit(1);

		if (existingImage.length === 0) {
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

		// 5. 更新データを構築（undefined の場合は既存の値を保持）
		const now = new Date().toISOString();
		const updateData: {
			latitude?: number | null;
			longitude?: number | null;
			takenAt?: string | null;
			status?: "published" | "draft";
			updatedAt: string;
		} = {
			updatedAt: now,
		};

		if (body.latitude !== undefined) {
			updateData.latitude = body.latitude;
		}
		if (body.longitude !== undefined) {
			updateData.longitude = body.longitude;
		}
		if (body.takenAt !== undefined) {
			updateData.takenAt = body.takenAt;
		}
		if (body.status !== undefined) {
			updateData.status = body.status;
		}

		// 6. 画像情報を更新
		await db
			.update(galleryImages)
			.set(updateData)
			.where(eq(galleryImages.id, imageId));

		// 7. 翻訳データの更新（指定されている場合）
		if (body.translations) {
			for (const translation of body.translations) {
				// 既存の翻訳を検索
				const existing = await db
					.select()
					.from(galleryImageTranslations)
					.where(
						and(
							eq(galleryImageTranslations.galleryImageId, imageId),
							eq(galleryImageTranslations.language, translation.language)
						)
					)
					.limit(1);

				if (existing.length > 0) {
					// 既存の翻訳を更新
					await db
						.update(galleryImageTranslations)
						.set({
							title: translation.title || null,
							description: translation.description || null,
							updatedAt: now,
						})
						.where(
							and(
								eq(galleryImageTranslations.galleryImageId, imageId),
								eq(galleryImageTranslations.language, translation.language)
							)
						);
				} else {
					// 新しい翻訳を追加
					await db.insert(galleryImageTranslations).values({
						galleryImageId: imageId,
						language: translation.language,
						title: translation.title || null,
						description: translation.description || null,
						createdAt: now,
						updatedAt: now,
					});
				}
			}
		}

		// 8. 更新後の画像情報を取得
		const [updatedImage] = await db
			.select()
			.from(galleryImages)
			.where(eq(galleryImages.id, imageId))
			.limit(1);

		// 9. 翻訳データを取得
		const translations = await db
			.select()
			.from(galleryImageTranslations)
			.where(eq(galleryImageTranslations.galleryImageId, imageId));

		// 10. レスポンスを返す
		return c.json(
			{
				data: {
					...updatedImage,
					translations,
				},
				message: "ギャラリー画像が正常に更新されました",
			},
			200
		);
	} catch (error) {
		console.error("Error updating gallery image:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "ギャラリー画像の更新に失敗しました",
				},
			},
			500
		);
	}
};
