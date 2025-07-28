import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	db,
	tags,
	tagTranslations,
} from "@saneatsu/db";
import { and, eq, like, sql } from "drizzle-orm";
import {
	ArticleCreateResponseSchema,
	ArticleCreateSchema,
	ArticleDetailQuerySchema,
	ArticleParamSchema,
	ArticleResponseSchema,
	ArticlesQuerySchema,
	ArticlesResponseSchema,
	ErrorSchema,
	SlugCheckQuerySchema,
	SlugCheckResponseSchema,
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
articlesRoute.openapi(listArticlesRoute, (async (c: any) => {
	try {
		const {
			page: pageStr = "1",
			limit: limitStr = "10",
			lang = "ja",
			status = "published",
			search,
		} = c.req.valid("query");
		const page = Number(pageStr);
		const limit = Number(limitStr);

		// ページネーションの計算
		const offset = (page - 1) * limit;

		// クエリ条件を構築
		const conditions = [];

		// ステータス条件
		if (status !== "all") {
			conditions.push(eq(articles.status, status));
		}

		// 言語条件
		conditions.push(eq(articleTranslations.language, lang));

		// 検索条件（SQLiteではlikeを使用、タイトルと内容の両方を検索）
		if (search) {
			conditions.push(
				sql`(
					${articleTranslations.title} LIKE ${`%${search}%`} OR 
					${articleTranslations.content} LIKE ${`%${search}%`}
				)`
			);
		}

		// 記事一覧を取得
		const articleList = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				updatedAt: articles.updatedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(and(...conditions))
			.limit(limit)
			.offset(offset);

		// 総記事数を取得
		const countConditions = [];
		if (status !== "all") {
			countConditions.push(eq(articles.status, status));
		}
		if (search) {
			countConditions.push(eq(articleTranslations.language, lang));
			countConditions.push(
				sql`(
					${articleTranslations.title} LIKE ${`%${search}%`} OR 
					${articleTranslations.content} LIKE ${`%${search}%`}
				)`
			);
		}

		const totalCount = await db
			.select({ count: articles.id })
			.from(articles)
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(countConditions.length > 0 ? and(...countConditions) : undefined);

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
}) as any);

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
articlesRoute.openapi(getArticleRoute, (async (c: any) => {
	try {
		const { slug } = c.req.valid("param");
		const { lang = "ja" } = c.req.valid("query");

		// 1. 記事詳細を取得
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

		const articleData = article[0];

		// 2. ステータスチェック - 公開済み以外は404
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

		// 3. 記事に紐付いているタグ情報を取得
		const relatedTags = await db
			.select({
				id: tags.id,
				slug: tags.slug,
				name: tagTranslations.name,
			})
			.from(articleTags)
			.innerJoin(tags, eq(articleTags.tagId, tags.id))
			.innerJoin(tagTranslations, eq(tags.id, tagTranslations.tagId))
			.where(
				and(
					eq(articleTags.articleId, articleData.id),
					eq(tagTranslations.language, lang)
				)
			);

		return c.json({
			data: {
				...articleData,
				tags: relatedTags,
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
}) as any);

/**
 * スラッグ重複チェックのルート定義
 */
const checkSlugRoute = createRoute({
	method: "get",
	path: "/check-slug",
	request: {
		query: SlugCheckQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SlugCheckResponseSchema,
				},
			},
			description: "スラッグチェック成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト",
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
	summary: "スラッグ重複チェック",
	description: "指定されたスラッグが既に使用されているかをチェックします。",
});

/**
 * GET /api/articles/check-slug - スラッグ重複チェック
 */
articlesRoute.openapi(checkSlugRoute, (async (c: any) => {
	try {
		const { slug } = c.req.valid("query");

		// 指定されたスラッグが既に存在するかチェック
		const existingArticle = await db
			.select({ id: articles.id })
			.from(articles)
			.where(eq(articles.slug, slug))
			.limit(1);

		const isAvailable = existingArticle.length === 0;

		return c.json({
			available: isAvailable,
			message: isAvailable ? undefined : "このスラッグは既に使用されています",
		});
	} catch (error) {
		console.error("Error checking slug:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to check slug",
				},
			},
			500
		);
	}
}) as any);

/**
 * 記事作成のルート定義
 */
const createArticleRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: ArticleCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: ArticleCreateResponseSchema,
				},
			},
			description: "記事作成成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "スラッグが既に存在",
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
	summary: "記事作成",
	description:
		"新しい記事を作成します。作成時に日本語の翻訳データも同時に保存されます。",
});

/**
 * POST /api/articles - 記事作成
 */
articlesRoute.openapi(createArticleRoute, (async (c: any) => {
	try {
		const { title, slug, content, status, publishedAt, tagIds } =
			c.req.valid("json");

		// 1. スラッグの重複チェック
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

		// 2. 記事データを作成
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

		// 3. 翻訳データを作成（日本語）
		await db.insert(articleTranslations).values({
			articleId: newArticle.id,
			language: "ja",
			title,
			content,
		});

		// TODO: 4. タグとの関連付けを実装（現在はスキップ）
		// TODO: 5. 自動翻訳処理を実装（現在はスキップ）

		// 5. レスポンス用のデータを取得
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
}) as any);
