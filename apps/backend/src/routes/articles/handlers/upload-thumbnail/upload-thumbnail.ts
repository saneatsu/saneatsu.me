import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { deleteImage, getDatabase, getImageUrl, uploadImage } from "@/lib";
import type { Env } from "@/types/env";

import type { uploadThumbnailRoute } from "./upload-thumbnail.openapi";

type Handler = RouteHandler<typeof uploadThumbnailRoute, { Bindings: Env }>;

/**
 * POST /api/articles/:id/thumbnail - サムネイル画像アップロード
 *
 * @description
 * 処理フロー:
 * 1. パスパラメータから記事IDを取得
 * 2. DBクライアントを作成
 * 3. 記事を取得
 * 4. 記事が存在しない場合は404エラー
 * 5. multipart/form-dataからfileを取得
 * 6. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
 * 7. 既存のcfImageIdがある場合、古い画像を削除
 * 8. Cloudflare Imagesにアップロード
 * 9. DBのcfImageIdを更新
 * 10. 画像URL（mediumバリアント）を生成
 * 11. レスポンスを返す
 */
export const uploadThumbnail: Handler = async (c) => {
	try {
		// 1. パスパラメータから記事IDを取得
		const { id } = c.req.valid("param");
		const articleId = Number.parseInt(id, 10);

		// 2. DBクライアントを作成
		const { createDatabaseClient, articles } = await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 3. 記事を取得
		const [article] = await db
			.select({
				id: articles.id,
				cfImageId: articles.cfImageId,
			})
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);

		// 4. 記事が存在しない場合は404エラー
		if (!article) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "指定された記事が見つかりません",
					},
				},
				404
			);
		}

		// 5. multipart/form-dataからfileを取得
		const body = await c.req.parseBody();
		const file = body.file;

		// 6. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
		if (!file || !(file instanceof File)) {
			return c.json(
				{
					error: {
						code: "INVALID_REQUEST",
						message:
							"ファイルが指定されていません。multipart/form-dataでfileフィールドに画像を指定してください。",
					},
				},
				400
			);
		}

		// 7. 既存のcfImageIdがある場合、古い画像を削除
		if (article.cfImageId) {
			try {
				await deleteImage(article.cfImageId, {
					CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
					CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
				});
				console.log(
					`Deleted old thumbnail image: ${article.cfImageId} for article ${articleId}`
				);
			} catch (error) {
				// 古い画像の削除に失敗してもアップロード処理は続行
				console.error(
					`Failed to delete old thumbnail image ${article.cfImageId}:`,
					error
				);
			}
		}

		// 8. Cloudflare Imagesにアップロード（thumbnailプレフィックス付き、環境別（NODE_ENV））
		const { imageId } = await uploadImage(
			file,
			{
				CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
				CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
				NODE_ENV: c.env.NODE_ENV,
			},
			{ prefix: "thumbnail" }
		);

		// 9. DBのcfImageIdを更新
		await db
			.update(articles)
			.set({
				cfImageId: imageId,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(articles.id, articleId));

		// 10. 画像URL（mediumバリアント）を生成
		const imageUrl = getImageUrl(
			imageId,
			"medium",
			c.env.CLOUDFLARE_ACCOUNT_HASH
		);

		// 11. レスポンスを返す
		return c.json(
			{
				imageId,
				imageUrl,
				message: "サムネイル画像が正常にアップロードされました",
			},
			200
		);
	} catch (error) {
		console.error("Error uploading thumbnail:", error);
		return c.json(
			{
				error: {
					code: "UPLOAD_FAILED",
					message: "サムネイル画像のアップロードに失敗しました",
				},
			},
			500
		);
	}
};
