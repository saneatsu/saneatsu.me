import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";

import type { Env } from "@/env";
import { deleteImage, getDatabase, uploadImage } from "@/lib";

import type { updateGalleryImageRoute } from "./update-gallery-image.openapi";

type Handler = RouteHandler<typeof updateGalleryImageRoute, { Bindings: Env }>;

/**
 * 許可される画像MIMEタイプ
 */
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
] as const;

/**
 * 最大ファイルサイズ（10MB）
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * PATCH /api/gallery/images/:id - ギャラリー画像更新
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータから画像IDを取得
 * 3. リクエストボディを取得（FormDataまたはJSON）
 * 4. 画像の存在確認
 * 5. ファイルが提供されている場合:
 *    5.1. ファイルバリデーション（サイズ、形式）
 *    5.2. 新しい画像をCloudflare Imagesにアップロード
 *    5.3. 旧画像を削除（エラーでも続行）
 *    5.4. cfImageIdを更新データに追加
 * 6. 更新データを構築（latitude, longitude, takenAt, status）
 * 7. 画像情報を更新（gallery_images）
 * 8. 翻訳データの更新（gallery_image_translations、指定されている場合）
 *    - 既存の翻訳は上書き、新しい言語は追加
 * 9. 更新後の画像情報を取得
 * 10. 翻訳データを取得
 * 11. レスポンスを返す
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

		// 3. リクエストボディの種類を判定
		const contentType = c.req.header("content-type") || "";
		const isFormData = contentType.includes("multipart/form-data");

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

		// 5. ファイルが提供されている場合、画像を置き換える
		let newCfImageId: string | undefined;
		if (isFormData) {
			const formBody = await c.req.parseBody();
			const file = formBody.file;

			// 5.1. ファイルバリデーション
			if (file && file instanceof File) {
				// サイズチェック
				if (file.size > MAX_FILE_SIZE) {
					return c.json(
						{
							error: {
								code: "FILE_TOO_LARGE",
								message: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでアップロードできます。`,
							},
						},
						400
					);
				}

				// 形式チェック
				if (
					!ALLOWED_MIME_TYPES.includes(
						file.type as (typeof ALLOWED_MIME_TYPES)[number]
					)
				) {
					return c.json(
						{
							error: {
								code: "INVALID_FILE_TYPE",
								message: `許可されていないファイル形式です。JPEG、PNG、GIF、WebP形式のみアップロードできます。（受信: ${file.type}）`,
							},
						},
						400
					);
				}

				// 5.2. 新しい画像をCloudflare Imagesにアップロード
				const uploadResult = await uploadImage(
					file,
					{
						CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
						CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
						NODE_ENV: c.env.NODE_ENV,
					},
					{ prefix: "gallery" }
				);
				newCfImageId = uploadResult.imageId;

				// 5.3. 旧画像を削除（エラーでも続行）
				const oldCfImageId = existingImage[0].cfImageId;
				try {
					await deleteImage(oldCfImageId, {
						CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
						CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
					});
				} catch (error) {
					console.error(`Failed to delete old image: ${oldCfImageId}`, error);
					// エラーでも処理を続行（孤立レコード防止）
				}
			}

			// 6. 更新データを構築（FormData）
			const now = new Date().toISOString();
			const updateData: {
				cfImageId?: string;
				latitude?: number | null;
				longitude?: number | null;
				takenAt?: string | null;
				status?: "published" | "draft";
				updatedAt: string;
			} = {
				updatedAt: now,
			};

			// 新しい画像がアップロードされた場合、cfImageIdを更新
			if (newCfImageId) {
				updateData.cfImageId = newCfImageId;
			}

			// FormDataの場合、フィールドは文字列として送信される
			if ("latitude" in formBody && typeof formBody.latitude === "string") {
				const lat = Number.parseFloat(formBody.latitude);
				if (!Number.isNaN(lat)) {
					updateData.latitude = lat;
				}
			}
			if ("longitude" in formBody && typeof formBody.longitude === "string") {
				const lon = Number.parseFloat(formBody.longitude);
				if (!Number.isNaN(lon)) {
					updateData.longitude = lon;
				}
			}
			if ("takenAt" in formBody && typeof formBody.takenAt === "string") {
				updateData.takenAt = formBody.takenAt;
			}
			if ("status" in formBody && typeof formBody.status === "string") {
				updateData.status = formBody.status as "published" | "draft";
			}

			// 7. 画像情報を更新
			await db
				.update(galleryImages)
				.set(updateData)
				.where(eq(galleryImages.id, imageId));

			// 8. 翻訳データの更新（指定されている場合）
			let translations: Array<{
				language: string;
				title?: string | null;
				description?: string | null;
			}> = [];

			if (
				"translations" in formBody &&
				typeof formBody.translations === "string"
			) {
				// FormDataの場合、JSON文字列をパース
				try {
					translations = JSON.parse(formBody.translations);
				} catch (error) {
					console.error("Failed to parse translations JSON:", error);
				}
			}

			if (translations.length > 0) {
				for (const translation of translations) {
					// 言語コードの型ガード
					const language = translation.language;
					if (language !== "ja" && language !== "en") {
						console.error(`Invalid language code: ${language}`);
						continue;
					}

					// 既存の翻訳を検索
					const existing = await db
						.select()
						.from(galleryImageTranslations)
						.where(
							and(
								eq(galleryImageTranslations.galleryImageId, imageId),
								eq(galleryImageTranslations.language, language)
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
									eq(galleryImageTranslations.language, language)
								)
							);
					} else {
						// 新しい翻訳を追加
						await db.insert(galleryImageTranslations).values({
							galleryImageId: imageId,
							language: language,
							title: translation.title || null,
							description: translation.description || null,
							createdAt: now,
							updatedAt: now,
						});
					}
				}
			}
		} else {
			// JSONの場合
			const jsonBody = c.req.valid("json") as {
				translations?: Array<{
					language: "ja" | "en";
					title?: string;
					description?: string;
				}>;
				latitude?: number;
				longitude?: number;
				takenAt?: string;
				status?: "published" | "draft";
			};

			// 6. 更新データを構築（JSON）
			const now = new Date().toISOString();
			const updateData: {
				cfImageId?: string;
				latitude?: number | null;
				longitude?: number | null;
				takenAt?: string | null;
				status?: "published" | "draft";
				updatedAt: string;
			} = {
				updatedAt: now,
			};

			if (jsonBody.latitude !== undefined) {
				updateData.latitude = jsonBody.latitude;
			}
			if (jsonBody.longitude !== undefined) {
				updateData.longitude = jsonBody.longitude;
			}
			if (jsonBody.takenAt !== undefined) {
				updateData.takenAt = jsonBody.takenAt;
			}
			if (jsonBody.status !== undefined) {
				updateData.status = jsonBody.status;
			}

			// 7. 画像情報を更新
			await db
				.update(galleryImages)
				.set(updateData)
				.where(eq(galleryImages.id, imageId));

			// 8. 翻訳データの更新（指定されている場合）
			if (jsonBody.translations) {
				for (const translation of jsonBody.translations) {
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
		}

		// 9. 更新後の画像情報を取得
		const [updatedImage] = await db
			.select()
			.from(galleryImages)
			.where(eq(galleryImages.id, imageId))
			.limit(1);

		// 10. 翻訳データを取得
		const translationsData = await db
			.select()
			.from(galleryImageTranslations)
			.where(eq(galleryImageTranslations.galleryImageId, imageId));

		// 11. レスポンスを返す
		return c.json(
			{
				data: {
					...updatedImage,
					translations: translationsData,
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
