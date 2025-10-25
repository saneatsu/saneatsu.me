import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { deleteImage, extractImageIdsFromMarkdown, getDatabase } from "@/lib";
import type { Env } from "@/types/env";

import type { deleteArticleRoute } from "./delete-article.openapi";

type Handler = RouteHandler<typeof deleteArticleRoute, { Bindings: Env }>;

/**
 * DELETE /api/articles/:id - 記事削除
 *
 * @description
 * 処理フロー:
 * 1. パスパラメータから記事IDを取得
 * 2. DBクライアントを作成
 * 3. 記事を取得
 * 4. 記事が存在しない場合は404エラー
 * 5. サムネイル画像（cfImageId）を削除
 * 6. Markdown内の画像IDを抽出
 * 7. 抽出した画像IDをCloudflare Imagesから削除
 * 8. DBから記事を削除（関連する articleTags も CASCADE で削除される）
 * 9. レスポンスを返す
 */
export const deleteArticle: Handler = async (c) => {
	try {
		// 1. パスパラメータから記事IDを取得
		const { id } = c.req.valid("param");
		const articleId = Number.parseInt(id, 10);

		// 2. DBクライアントを作成
		const { createDatabaseClient, articles, articleTranslations } =
			await getDatabase();
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

		// 翻訳データを取得（Markdown内の画像を抽出するため）
		const translations = await db
			.select({
				content: articleTranslations.content,
			})
			.from(articleTranslations)
			.where(eq(articleTranslations.articleId, articleId));

		// 5. サムネイル画像（cfImageId）を削除
		if (article.cfImageId) {
			try {
				await deleteImage(article.cfImageId, {
					CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
					CLOUDFLARE_IMAGES_TOKEN: c.env.CLOUDFLARE_IMAGES_TOKEN,
				});
				console.log(
					`Deleted thumbnail image: ${article.cfImageId} for article ${articleId}`
				);
			} catch (error) {
				// サムネイル削除失敗してもログだけ出して処理続行
				console.error(
					`Failed to delete thumbnail image ${article.cfImageId}:`,
					error
				);
			}
		}

		// 6. Markdown内の画像IDを抽出
		const allImageIds = new Set<string>();
		for (const translation of translations) {
			if (!translation.content) continue;

			const imageIds = extractImageIdsFromMarkdown(translation.content);
			for (const imageId of imageIds) {
				allImageIds.add(imageId);
			}
		}

		// 7. 抽出した画像IDをCloudflare Imagesから削除
		for (const imageId of allImageIds) {
			try {
				await deleteImage(imageId, {
					CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
					CLOUDFLARE_IMAGES_TOKEN: c.env.CLOUDFLARE_IMAGES_TOKEN,
				});
				console.log(
					`Deleted content image: ${imageId} for article ${articleId}`
				);
			} catch (error) {
				// 個別の画像削除失敗してもログだけ出して処理続行
				console.error(`Failed to delete content image ${imageId}:`, error);
			}
		}

		// 8. DBから記事を削除（関連する articleTags も CASCADE で削除される）
		await db.delete(articles).where(eq(articles.id, articleId));

		// 9. レスポンスを返す
		return c.json(
			{
				message: "記事が正常に削除されました",
			},
			200
		);
	} catch (error) {
		console.error("Error deleting article:", error);
		return c.json(
			{
				error: {
					code: "DELETE_FAILED",
					message: "記事の削除に失敗しました",
				},
			},
			500
		);
	}
};
