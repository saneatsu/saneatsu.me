import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import { createTranslationService } from "@/services/gemini-translation/gemini-translation";
import type { createArticleRoute } from "./create-article.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

type Handler = RouteHandler<typeof createArticleRoute, { Bindings: Env }>;

/**
 * POST /api/articles - 記事作成
 *
 * @description
 * 1. DBクライアントを作成
 * 2. リクエストボディを取得
 * 3. スラッグの重複チェック
 * 4. 記事データを作成
 * 5. 翻訳データを作成（日本語）
 * 6. 英語への自動翻訳を実行（非同期）
 * 7. タグとの関連付けを実装
 * 8. レスポンス用のデータを取得
 * 9. レスポンスを返す
 */
export const createArticle: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, articles, articleTags, articleTranslations } =
			await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. リクエストボディを取得
		const { title, slug, content, status, publishedAt, tagIds } =
			c.req.valid("json");

		// 3. スラッグの重複チェック
		const existingArticle = await db
			.select({ id: articles.id })
			.from(articles)
			.where(eq(articles.slug, slug))
			.limit(1);

		if (existingArticle.length > 0) {
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

		// 4. 記事データを作成
		const now = new Date().toISOString();
		const finalPublishedAt = status === "published" ? publishedAt || now : null;

		const [newArticle] = await db
			.insert(articles)
			.values({
				slug,
				status,
				publishedAt: finalPublishedAt,
				cfImageId: null, // 現在は画像なし
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		// 5. 翻訳データを作成（日本語）
		await db.insert(articleTranslations).values({
			articleId: newArticle.id,
			language: "ja",
			title,
			content,
		});

		// 6. 英語への自動翻訳を実行（非同期）
		if (c.env.GEMINI_API_KEY) {
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				// 翻訳を実行
				const translatedArticle = await translationService.translateArticle(
					title,
					content
				);

				if (translatedArticle) {
					// 英語版を保存
					await db.insert(articleTranslations).values({
						articleId: newArticle.id,
						language: "en",
						title: translatedArticle.title,
						content: translatedArticle.content,
					});
					console.log(`Article ${newArticle.id} translated successfully`);
				} else {
					console.warn(
						`Translation failed for article ${newArticle.id}, continuing without translation`
					);
				}
			} catch (error) {
				// 翻訳エラーが発生してもメインの処理は続行
				console.error(`Translation error for article ${newArticle.id}:`, error);
			}
		} else {
			console.log("GEMINI_API_KEY not configured, skipping translation");
		}

		// 7. タグとの関連付けを実装（tagIdsが提供された場合）
		if (tagIds && tagIds.length > 0) {
			try {
				const tagAssociations = tagIds.map((tagId) => ({
					articleId: newArticle.id,
					tagId: tagId,
				}));
				await db.insert(articleTags).values(tagAssociations);
				console.log(
					`Associated ${tagIds.length} tags with article ${newArticle.id}`
				);
			} catch (error) {
				console.error(
					`Failed to associate tags with article ${newArticle.id}:`,
					error
				);
				// タグの関連付けに失敗しても記事作成は成功とする
			}
		}

		// 8. レスポンス用のデータを取得
		const createdArticle = await db
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
			.where(eq(articles.id, newArticle.id))
			.limit(1);

		// 9. レスポンスを返す
		return c.json(
			{
				data: createdArticle[0],
				message: "記事が正常に作成されました",
			},
			201
		);
	} catch (error) {
		console.error("Error creating article:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to create article",
				},
			},
			500
		);
	}
};
