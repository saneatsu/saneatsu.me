import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { getArticlesByGalleryImageRoute } from "./get-articles-by-gallery-image.openapi";

type Handler = RouteHandler<
	typeof getArticlesByGalleryImageRoute,
	{ Bindings: Env }
>;

/**
 * GET /api/gallery/:id/articles - ギャラリー画像を使用している記事一覧取得
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータからidを取得
 * 3. ギャラリー画像の存在確認
 * 4. article_gallery_imagesテーブルから記事を取得
 * 5. 記事の翻訳データ（日本語）を取得
 * 6. レスポンスを返す
 */
export const getArticlesByGalleryImageHandler: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const {
			createDatabaseClient,
			articleGalleryImages,
			articles,
			articleTranslations,
			galleryImages,
		} = await getDatabase();
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

		// 3. ギャラリー画像の存在確認
		const [image] = await db
			.select({ id: galleryImages.id })
			.from(galleryImages)
			.where(eq(galleryImages.id, imageId))
			.limit(1);

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

		// 4. article_gallery_imagesテーブルから記事を取得
		// 5. 記事の翻訳データ（日本語）を取得
		const articleList = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				title: articleTranslations.title,
				status: articles.status,
				publishedAt: articles.publishedAt,
				cfImageId: articles.cfImageId,
				createdAt: articles.createdAt,
			})
			.from(articleGalleryImages)
			.innerJoin(articles, eq(articleGalleryImages.articleId, articles.id))
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, "ja")
				)
			)
			.where(eq(articleGalleryImages.galleryImageId, imageId))
			.orderBy(articles.createdAt);

		// 6. レスポンスを返す
		return c.json(
			{
				articles: articleList,
				total: articleList.length,
			},
			200
		);
	} catch (error) {
		console.error("Error getting articles by gallery image:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "記事の取得に失敗しました",
				},
			},
			500
		);
	}
};
