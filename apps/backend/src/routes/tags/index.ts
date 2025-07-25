import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	db,
	tags,
	tagTranslations,
} from "@saneatsu/db";
import { and, eq, sql } from "drizzle-orm";
import {
	ErrorSchema,
	TagArticlesParamSchema,
	TagArticlesQuerySchema,
	TagArticlesResponseSchema,
	TagsQuerySchema,
	TagsResponseSchema,
} from "./schema";

/**
 * タグ関連のAPIルート
 */
export const tagsRoute = new OpenAPIHono();

/**
 * タグ一覧取得のルート定義
 */
const listTagsRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: TagsQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagsResponseSchema,
				},
			},
			description: "タグ一覧の取得成功",
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
	tags: ["Tags"],
	summary: "タグ一覧取得",
	description: "全てのタグとそれぞれの記事数を取得します。",
});

/**
 * GET /api/tags - タグ一覧取得
 */
tagsRoute.openapi(listTagsRoute, (async (c: any) => {
	try {
		const { lang = "ja" } = c.req.valid("query");

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
}) as any);

/**
 * タグ別記事一覧取得のルート定義
 */
const getTagArticlesRoute = createRoute({
	method: "get",
	path: "/:slug/articles",
	request: {
		params: TagArticlesParamSchema,
		query: TagArticlesQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagArticlesResponseSchema,
				},
			},
			description: "タグ別記事一覧の取得成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "タグが見つからない",
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
	tags: ["Tags"],
	summary: "タグ別記事一覧取得",
	description:
		"指定されたタグに紐づく記事一覧を取得します。ページネーションと言語フィルタリングに対応しています。",
});

/**
 * GET /api/tags/:slug/articles - タグ別記事一覧取得
 */
tagsRoute.openapi(getTagArticlesRoute, (async (c: any) => {
	try {
		const { slug } = c.req.valid("param");
		const {
			page: pageStr = "1",
			limit: limitStr = "10",
			lang = "ja",
		} = c.req.valid("query");
		const page = Number(pageStr);
		const limit = Number(limitStr);

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
}) as any);
