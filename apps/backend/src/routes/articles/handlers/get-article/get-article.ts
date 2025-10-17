import type { RouteHandler } from "@hono/zod-openapi";
import { articles, articleTranslations } from "@saneatsu/db/worker";
import { and, eq, sql } from "drizzle-orm";

import { convertWikiLinks } from "@/utils/wiki-link";

import type { getArticleRoute } from "./get-article.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

type Handler = RouteHandler<typeof getArticleRoute, { Bindings: Env }>;

/**
 * GET /api/articles/:slug - 記事詳細取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータを取得
 * 3. 記事詳細を取得
 * 4. 記事が見つからない場合は404
 * 5. 公開済み以外は404
 * 6. 現在のログインユーザーを取得
 * 7. 閲覧数をインクリメント（公開済み記事かつ作者以外の場合のみ）
 * 8. Wiki Linkをコンテンツ内で変換
 * 9. レスポンスを返す
 */
export const getArticle: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. パラメータを取得
		const { slug } = c.req.valid("param");
		const { lang = "ja" } = c.req.valid("query");

		// 3. 記事詳細を取得
		const article = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				authorId: articles.authorId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				updatedAt: articles.updatedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
				viewCount: sql<number>`COALESCE(${articleTranslations.viewCount}, 0)`,
				translationId: articleTranslations.id,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
			)
			.where(eq(articles.slug, slug))
			.limit(1);

		// 4. 記事が見つからない場合は404
		if (article.length === 0) {
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

		const articleData = article[0];

		// 5. 公開済み以外は404
		if (articleData.status !== "published") {
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

		// 6. 現在のログインユーザーを取得（将来的には認証から取得）
		// TODO: 認証システムが実装されたら、認証情報からユーザーIDを取得する
		const currentUserEmail = "nito.tech.official@gmail.com"; // 仮のログインユーザー
		const { getUserByEmail } = await import("../../../auth/service");
		const currentUser = await getUserByEmail(db, currentUserEmail);

		// 7. 閲覧数をインクリメント（公開済み記事かつ作者以外の場合のみ）
		const isAuthor = currentUser && articleData.authorId === currentUser.id;

		if (articleData.translationId && !isAuthor) {
			await db
				.update(articleTranslations)
				.set({
					viewCount: sql`${articleTranslations.viewCount} + 1`,
				})
				.where(eq(articleTranslations.id, articleData.translationId));

			// レスポンス用に更新後の値を設定
			articleData.viewCount = (articleData.viewCount || 0) + 1;
		}

		// 8. Wiki Linkをコンテンツ内で変換
		const convertedContent = articleData.content
			? await convertWikiLinks(db, articleData.content, lang)
			: articleData.content;

		// 9. レスポンスを返す
		return c.json(
			{
				data: {
					id: articleData.id,
					slug: articleData.slug,
					cfImageId: articleData.cfImageId,
					status: articleData.status,
					publishedAt: articleData.publishedAt,
					updatedAt: articleData.updatedAt,
					title: articleData.title,
					content: convertedContent,
					viewCount: articleData.viewCount,
				},
			},
			200
		);
	} catch (error) {
		console.error("Error fetching article:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch article",
				},
			},
			500
		);
	}
};
