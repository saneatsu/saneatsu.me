import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { articles, articleTranslations, db } from "@saneatsu/db";
import { and, eq } from "drizzle-orm";
import {
	ArticleDetailQuerySchema,
	ArticleParamSchema,
	ArticleResponseSchema,
	ArticlesQuerySchema,
	ArticlesResponseSchema,
	ErrorSchema,
} from "./schema";

/**
 * 記事関連のAPIルート
 */
export const articlesRoute = new OpenAPIHono();

/**
 * 記事一覧取得のルート定義
 */
const listArticlesRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: ArticlesQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ArticlesResponseSchema,
				},
			},
			description: "記事一覧の取得成功",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Articles"],
	summary: "記事一覧取得",
	description:
		"公開済みの記事一覧を取得します。ページネーションと言語フィルタリングに対応しています。",
});

/**
 * GET /api/articles - 記事一覧取得
 */
articlesRoute.openapi(listArticlesRoute, async (c) => {
	try {
		const {
			page: pageStr = "1",
			limit: limitStr = "10",
			lang = "ja",
		} = c.req.valid("query");
		const page = Number(pageStr);
		const limit = Number(limitStr);

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
 * 記事詳細取得のルート定義
 */
const getArticleRoute = createRoute({
	method: "get",
	path: "/:slug",
	request: {
		params: ArticleParamSchema,
		query: ArticleDetailQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ArticleResponseSchema,
				},
			},
			description: "記事詳細の取得成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "記事が見つからない",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Articles"],
	summary: "記事詳細取得",
	description: "指定されたスラッグの記事詳細を取得します。",
});

/**
 * GET /api/articles/:slug - 記事詳細取得
 */
articlesRoute.openapi(getArticleRoute, async (c) => {
	try {
		const { slug } = c.req.valid("param");
		const { lang = "ja" } = c.req.valid("query");

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
