import {
	articles,
	articleTags,
	articleTranslations,
	db,
	tags,
	tagTranslations,
} from "@saneatsu/db";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

/**
 * タグ関連のAPIルート
 */
export const tagsRoute = new Hono();

/**
 * GET /api/tags - タグ一覧取得
 * クエリパラメータ:
 * - lang: 言語（ja/en、デフォルト: ja）
 */
tagsRoute.get("/", async (c) => {
	try {
		const lang = c.req.query("lang") || "ja";

		// タグ一覧と記事数を取得
		const tagList = await db
			.select({
				id: tags.id,
				slug: tags.slug,
				name: tagTranslations.name,
				articleCount: sql<number>`COUNT(DISTINCT ${articleTags.articleId})`,
			})
			.from(tags)
			.leftJoin(tagTranslations, eq(tags.id, tagTranslations.tagId))
			.leftJoin(articleTags, eq(tags.id, articleTags.tagId))
			.where(eq(tagTranslations.language, lang as "ja" | "en"))
			.groupBy(tags.id, tagTranslations.name);

		return c.json({
			data: tagList,
		});
	} catch (error) {
		console.error("Error fetching tags:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tags",
				},
			},
			500
		);
	}
});

/**
 * GET /api/tags/:slug/articles - タグ別記事一覧取得
 * パラメータ:
 * - slug: タグのスラッグ
 * クエリパラメータ:
 * - page: ページ番号（デフォルト: 1）
 * - limit: 1ページあたりの記事数（デフォルト: 10）
 * - lang: 言語（ja/en、デフォルト: ja）
 */
tagsRoute.get("/:slug/articles", async (c) => {
	try {
		const slug = c.req.param("slug");
		const page = Number(c.req.query("page") || "1");
		const limit = Number(c.req.query("limit") || "10");
		const lang = c.req.query("lang") || "ja";

		// ページネーションの計算
		const offset = (page - 1) * limit;

		// タグIDを取得
		const tag = await db
			.select({ id: tags.id })
			.from(tags)
			.where(eq(tags.slug, slug))
			.limit(1);

		if (tag.length === 0) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Tag not found",
					},
				},
				404
			);
		}

		// タグに紐づく記事一覧を取得
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
			.innerJoin(articleTags, eq(articles.id, articleTags.articleId))
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(
				and(
					eq(articleTags.tagId, tag[0].id),
					eq(articles.status, "published"),
					eq(articleTranslations.language, lang as "ja" | "en")
				)
			)
			.limit(limit)
			.offset(offset);

		// 総記事数を取得
		const totalCount = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(articles)
			.innerJoin(articleTags, eq(articles.id, articleTags.articleId))
			.where(
				and(eq(articleTags.tagId, tag[0].id), eq(articles.status, "published"))
			);

		return c.json({
			data: articleList,
			pagination: {
				page,
				limit,
				total: totalCount[0].count,
				totalPages: Math.ceil(totalCount[0].count / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching tag articles:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tag articles",
				},
			},
			500
		);
	}
});
