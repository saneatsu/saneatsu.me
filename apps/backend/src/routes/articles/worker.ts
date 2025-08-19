import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	articles,
	articleTranslations,
	articleTags,
	tags,
	createDatabaseClient,
} from "@saneatsu/db/worker";
import { articleListQuerySchema as ImportedArticlesQuerySchema } from "@saneatsu/schemas";
import { and, eq, sql } from "drizzle-orm";

// 一時的なスキーマ定義
const ArticleParamSchema = z.object({
	slug: z.string(),
});

const ArticleAdminParamSchema = z.object({
	id: z.string(),
});

const ArticleDetailQuerySchema = z.object({
	lang: z.string().optional(),
});

const TagSchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	name: z.string().nullable(),
});

const ArticleResponseSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string().nullable(),
	description: z.string().nullable(),
	content: z.string().nullable(),
	viewCount: z.number().int(),
	cfImageId: z.string().nullable(),
	status: z.enum(["draft", "published", "archived"]),
	publishedAt: z.string().nullable(),
	language: z.enum(["ja", "en"]).nullable(),
	tags: z.array(z.string()).optional(),
});

const ArticleAdminResponseSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string().nullable(),
	content: z.string().nullable(),
	viewCount: z.number().int(),
	cfImageId: z.string().nullable(),
	status: z.enum(["draft", "published", "archived"]),
	publishedAt: z.string().nullable(),
	updatedAt: z.string().nullable(),
	tags: z.array(TagSchema),
});

const ArticlesResponseSchema = z.object({
	data: z.array(ArticleResponseSchema),
	pagination: z.object({
		total: z.number().int(),
		page: z.number().int(),
		pageSize: z.number().int(),
		totalPages: z.number().int(),
	}),
});

const ErrorSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
	}),
});

/**
 * Cloudflare Workers用の記事関連APIルート
 *
 * @description
 * 環境変数をc.envから取得してデータベースに接続する
 */

// Cloudflare Workers環境の型定義
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
};

export const articlesRoute = new OpenAPIHono<{ Bindings: Env }>();

/**
 * 記事一覧取得のルート定義
 */
const listArticlesRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: ImportedArticlesQuerySchema as any,
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
articlesRoute.openapi(listArticlesRoute, async (c: any) => {
	try {
		// Cloudflare Workers環境でデータベースクライアントを初期化
		const db = createDatabaseClient(c.env);

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
articlesRoute.openapi(getArticleRoute, async (c: any) => {
	try {
		// Cloudflare Workers環境でデータベースクライアントを初期化
		const db = createDatabaseClient(c.env);

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

/**
 * 管理画面用記事詳細取得のルート定義
 */
const getArticleByIdRoute = createRoute({
	method: "get",
	path: "/admin/:id",
	request: {
		params: ArticleAdminParamSchema,
		query: ArticleDetailQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						data: ArticleAdminResponseSchema,
					}),
				},
			},
			description: "記事詳細の取得成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト",
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
	summary: "管理画面用記事詳細取得",
	description:
		"管理画面で使用する記事詳細を取得します。ステータスに関わらず取得可能です。",
});

/**
 * GET /api/articles/admin/:id - 管理画面用記事詳細取得
 */
articlesRoute.openapi(getArticleByIdRoute, async (c: any) => {
	try {
		// Cloudflare Workers環境でデータベースクライアントを初期化
		const db = createDatabaseClient(c.env);

		const { id } = c.req.valid("param");
		const { lang = "ja" } = c.req.valid("query");

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

		// 1. 記事詳細を取得（ステータスに関わらず）
		const article = await db
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
					eq(articleTranslations.language, lang)
				)
			)
			.where(eq(articles.id, articleId))
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

		const articleData = article[0];

		// 2. タグ情報を取得
		const articleTagsData = await db
			.select({
				id: tags.id,
				slug: tags.slug,
				name: tags.slug,
			})
			.from(articleTags)
			.innerJoin(tags, eq(articleTags.tagId, tags.id))
			.where(eq(articleTags.articleId, articleId));

		return c.json({
			data: {
				...articleData,
				tags: articleTagsData,
			},
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
