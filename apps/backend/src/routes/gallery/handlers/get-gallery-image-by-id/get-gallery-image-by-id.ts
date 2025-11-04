import type { RouteHandler } from "@hono/zod-openapi";
import { eq, sql } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { getGalleryImageByIdRoute } from "./get-gallery-image-by-id.openapi";

type Handler = RouteHandler<typeof getGalleryImageByIdRoute, { Bindings: Env }>;

/**
 * GET /api/gallery/:id - ギャラリー画像詳細取得
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータからidを取得
 * 3. ギャラリー画像を取得
 * 4. 画像が存在しない場合は404エラー
 * 5. 翻訳データを取得
 * 6. 言語パラメータが指定されている場合、その言語の翻訳のみを返す
 * 7. レスポンスを返す
 */
export const getGalleryImageByIdHandler: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, galleryImages, galleryImageTranslations } =
			await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. パスパラメータからidを取得
		const { id } = c.req.valid("param");
		const imageId = Number.parseInt(id, 10);

		// バリデーション
		if (Number.isNaN(imageId) || imageId < 1) {
			return c.json(
				{
					error: {
						code: "INVALID_ID",
						message: "IDは1以上の数値を指定してください。",
					},
				},
				400
			);
		}

		// 3. ギャラリー画像を取得
		const [image] = await db
			.select()
			.from(galleryImages)
			.where(eq(galleryImages.id, imageId));

		// 4. 画像が存在しない場合は404エラー
		if (!image) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "指定されたギャラリー画像が見つかりません。",
					},
				},
				404
			);
		}

		// 5. 翻訳データを取得
		const query = c.req.valid("query");
		const language = query.language;

		let translations: (typeof galleryImageTranslations.$inferSelect)[];
		if (language) {
			// 6. 言語パラメータが指定されている場合、その言語の翻訳のみを返す
			translations = await db
				.select()
				.from(galleryImageTranslations)
				.where(
					sql`${galleryImageTranslations.galleryImageId} = ${imageId} AND ${galleryImageTranslations.language} = ${language}`
				);
		} else {
			// すべての言語の翻訳を返す
			translations = await db
				.select()
				.from(galleryImageTranslations)
				.where(eq(galleryImageTranslations.galleryImageId, imageId));
		}

		// 7. レスポンスを返す
		return c.json(
			{
				...image,
				translations,
			},
			200
		);
	} catch (error) {
		console.error("Error getting gallery image by id:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "ギャラリー画像の取得に失敗しました",
				},
			},
			500
		);
	}
};
