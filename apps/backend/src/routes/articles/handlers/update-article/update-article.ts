import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq, not } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";
import { createTranslationService } from "@/services/gemini-translation/gemini-translation";

import type { updateArticleRoute } from "./update-article.openapi";

type Handler = RouteHandler<typeof updateArticleRoute, { Bindings: Env }>;

/**
 * PUT /api/articles/:id - 記事更新
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータとリクエストボディを取得
 * 3. 既存記事の存在確認
 * 4. スラッグの重複チェック（自分自身は除外）
 * 5. 記事データを更新
 * 6. 翻訳データを更新（日本語）
 * 7. 英語への自動翻訳を実行
 * 8. タグとの関連付けを更新
 * 9. レスポンス用のデータを取得
 * 10. レスポンスを返す
 */
export const updateArticle: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, articles, articleTags, articleTranslations } =
			await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. パラメータとリクエストボディを取得
		const { id } = c.req.valid("param");
		const { title, slug, content, status, publishedAt, tagIds } =
			c.req.valid("json");

		const articleId = parseInt(id);
		if (Number.isNaN(articleId)) {
			return c.json(
				{
					error: {
						code: "INVALID_ID",
						message: "Invalid article ID",
					},
				},
				400
			);
		}

		// 3. 既存記事の存在確認
		const existingArticle = await db
			.select({ id: articles.id, slug: articles.slug })
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);

		if (existingArticle.length === 0) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Article not found",
					},
				},
				404
			);
		}

		// 4. スラッグの重複チェック（自分自身は除外）
		if (existingArticle[0].slug !== slug) {
			const duplicateSlug = await db
				.select({ id: articles.id })
				.from(articles)
				.where(and(eq(articles.slug, slug), not(eq(articles.id, articleId))))
				.limit(1);

			if (duplicateSlug.length > 0) {
				return c.json(
					{
						error: {
							code: "SLUG_ALREADY_EXISTS",
							message: "このスラッグは既に使用されています",
						},
					},
					409
				);
			}
		}

		// 5. 記事データを更新
		const now = new Date().toISOString();
		const finalPublishedAt = status === "published" ? publishedAt || now : null;

		await db
			.update(articles)
			.set({
				slug,
				status,
				publishedAt: finalPublishedAt,
				updatedAt: now,
			})
			.where(eq(articles.id, articleId));

		// 6. 翻訳データを更新（日本語）
		await db
			.update(articleTranslations)
			.set({
				title,
				content,
			})
			.where(
				and(
					eq(articleTranslations.articleId, articleId),
					eq(articleTranslations.language, "ja")
				)
			);

		// 7. 英語への自動翻訳を実行（非同期）
		if (c.env.GEMINI_API_KEY) {
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				// 記事を翻訳
				const translatedArticle = await translationService.translateArticle(
					title,
					content
				);

				if (translatedArticle) {
					// 英語版を更新
					await db
						.update(articleTranslations)
						.set({
							title: translatedArticle.title,
							content: translatedArticle.content,
						})
						.where(
							and(
								eq(articleTranslations.articleId, articleId),
								eq(articleTranslations.language, "en")
							)
						);
					console.log(`Article ${articleId} translated successfully`);
				} else {
					console.warn(
						`Translation failed for article ${articleId}, continuing without English translation update`
					);
				}
			} catch (error) {
				// 翻訳エラーが発生してもメインの処理は続行
				console.error(`Translation error for article ${articleId}:`, error);
			}
		} else {
			console.log("GEMINI_API_KEY not configured, skipping translation");
		}

		// 8. タグとの関連付けを更新
		// 既存のタグ関連を削除
		await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

		// 新しいタグ関連を作成
		if (tagIds && tagIds.length > 0) {
			await db.insert(articleTags).values(
				tagIds.map((tagId) => ({
					articleId,
					tagId,
				}))
			);
		}

		// 9. レスポンス用のデータを取得
		const updatedArticle = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				updatedAt: articles.updatedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
				viewCount: articles.viewCount,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, "ja")
				)
			)
			.where(eq(articles.id, articleId))
			.limit(1);

		// 10. レスポンスを返す
		return c.json(
			{
				data: updatedArticle[0],
				message: "記事が正常に更新されました",
			},
			200
		);
	} catch (error) {
		console.error("Error updating article:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update article",
				},
			},
			500
		);
	}
};
