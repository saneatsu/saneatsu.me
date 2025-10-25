import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import type { Env } from "@/env";
import { deleteImage, getDatabase } from "@/lib";

import type { deleteThumbnailRoute } from "./delete-thumbnail.openapi";

type Handler = RouteHandler<typeof deleteThumbnailRoute, { Bindings: Env }>;

/**
 * DELETE /api/articles/:id/thumbnail - サムネイル画像削除
 *
 * @description
 * 処理フロー:
 * 1. パスパラメータから記事IDを取得
 * 2. DBクライアントを作成
 * 3. 記事を取得
 * 4. 記事が存在しない場合は404エラー
 * 5. cfImageIdがnullの場合は404エラー（削除する画像がない）
 * 6. Cloudflare Imagesから画像を削除
 * 7. DBのcfImageIdをnullに更新
 * 8. レスポンスを返す
 */
export const deleteThumbnail: Handler = async (c) => {
	try {
		// 1. パスパラメータから記事IDを取得
		const { id } = c.req.valid("param");
		const articleId = Number.parseInt(id, 10);

		// 2. DBクライアントを作成
		const { createDatabaseClient, articles } = await getDatabase();
		const db = createDatabaseClient(c.env);

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

		// 5. cfImageIdがnullの場合は404エラー（削除する画像がない）
		if (!article.cfImageId) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "削除するサムネイル画像が存在しません",
					},
				},
				404
			);
		}

		// 6. Cloudflare Imagesから画像を削除
		await deleteImage(article.cfImageId, {
			CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
			CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
		});

		// 7. DBのcfImageIdをnullに更新
		await db
			.update(articles)
			.set({
				cfImageId: null,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(articles.id, articleId));

		// 8. レスポンスを返す
		return c.json(
			{
				message: "サムネイル画像が正常に削除されました",
			},
			200
		);
	} catch (error) {
		console.error("Error deleting thumbnail:", error);
		return c.json(
			{
				error: {
					code: "DELETE_FAILED",
					message: "サムネイル画像の削除に失敗しました",
				},
			},
			500
		);
	}
};
