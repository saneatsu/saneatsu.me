import type { RouteHandler } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
} from "@saneatsu/db/worker";
import { and, eq, not, sql } from "drizzle-orm";
import { createTranslationService } from "@/services/gemini-translation";
import type { updateArticleRoute } from "./update-article.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

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
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

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

		// 7. 英語への自動翻訳を実行
		if (c.env.GEMINI_API_KEY) {
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				// 既存の英語翻訳を確認
				const existingEnTranslation = await db
					.select({
						id: articleTranslations.id,
						title: articleTranslations.title,
						content: articleTranslations.content,
					})
					.from(articleTranslations)
					.where(
						and(
							eq(articleTranslations.articleId, articleId),
							eq(articleTranslations.language, "en")
						)
					)
					.limit(1);

				// 翻訳を実行
				const translatedArticle = await translationService.translateArticle(
					title,
					content
				);

				if (translatedArticle) {
					if (existingEnTranslation.length > 0) {
						// 既存の英語翻訳を更新
						await db
							.update(articleTranslations)
							.set({
								title: translatedArticle.title,
								content: translatedArticle.content,
							})
							.where(eq(articleTranslations.id, existingEnTranslation[0].id));
						console.log(`Article ${articleId} translation updated`);
					} else {
						// 新規に英語翻訳を作成
						await db.insert(articleTranslations).values({
							articleId,
							language: "en",
							title: translatedArticle.title,
							content: translatedArticle.content,
						});
						console.log(`Article ${articleId} translated for the first time`);
					}
				} else {
					console.warn(
						`Translation failed for article ${articleId}, continuing without translation`
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
				viewCount: sql<number>`COALESCE(${articleTranslations.viewCount}, 0)`,
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
