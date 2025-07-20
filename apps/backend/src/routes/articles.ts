import { articles, articleTranslations, db } from "@saneatsu/db";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

/**
 * 記事関連のAPIルート
 */
export const articlesRoute = new Hono();

/**
 * GET /api/articles - 記事一覧取得
 * クエリパラメータ:
 * - page: ページ番号（デフォルト: 1）
 * - limit: 1ページあたりの記事数（デフォルト: 10）
 * - lang: 言語（ja/en、デフォルト: ja）
 */
articlesRoute.get("/", async (c) => {
	try {
		const page = Number(c.req.query("page") || "1");
		const limit = Number(c.req.query("limit") || "10");
		const lang = (c.req.query("lang") || "ja") as "ja" | "en";

		// ページネーションの計算
		const offset = (page - 1) * limit;

		// 記事一覧を取得（公開済みのみ）
		const articleList = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(
				and(
					eq(articles.status, "published"),
					eq(articleTranslations.language, lang)
				)
			)
			.limit(limit)
			.offset(offset);

		// 総記事数を取得
		const totalCount = await db
			.select({ count: articles.id })
			.from(articles)
			.where(eq(articles.status, "published"));

		return c.json({
			data: articleList,
			pagination: {
				page,
				limit,
				total: totalCount.length,
				totalPages: Math.ceil(totalCount.length / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching articles:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch articles",
				},
			},
			500
		);
	}
});

/**
 * GET /api/articles/:slug - 記事詳細取得
 * パラメータ:
 * - slug: 記事のスラッグ
 * クエリパラメータ:
 * - lang: 言語（ja/en、デフォルト: ja）
 */
articlesRoute.get("/:slug", async (c) => {
	try {
		const slug = c.req.param("slug");
		const lang = (c.req.query("lang") || "ja") as "ja" | "en";

		// 記事詳細を取得
		const article = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(
				and(eq(articles.slug, slug), eq(articleTranslations.language, lang))
			)
			.limit(1);

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

		return c.json({
			data: article[0],
		});
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
});
