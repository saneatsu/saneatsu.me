import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	db,
	tags,
	tagTranslations,
} from "@saneatsu/db";
import {
	articleListQuerySchema,
	type SortOrder,
} from "@saneatsu/schemas/dist/articles";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getSuggestionsRoute, handleArticleSuggestions } from "./suggestions";

// OpenAPI用にpackages/schemasをラップ
const articlesOpenApiQuerySchema = z.object({
	page: z.string().optional().openapi({
		example: "1",
		description: "ページ番号",
	}),
	limit: z.string().optional().openapi({
		example: "10",
		description: "1ページあたりの記事数",
	}),
	language: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
	status: z.enum(["published", "draft", "archived"]).optional().openapi({
		example: "published",
		description: "記事のステータス",
	}),
	search: z.string().optional().openapi({
		example: "検索キーワード",
		description: "タイトル検索",
	}),
	sortBy: z
		.enum(["createdAt", "updatedAt", "publishedAt", "title", "viewCount"])
		.optional()
		.openapi({
			example: "createdAt",
			description: "ソートカラム",
		}),
	sortOrder: z.enum(["asc", "desc"]).optional().openapi({
		example: "desc",
		description: "ソート順",
	}),
});

// 必要なOpenAPIスキーマ定義
const ArticleTagSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "タグのユニークID",
	}),
	slug: z.string().openapi({
		example: "javascript",
		description: "タグのスラッグ",
	}),
	name: z.string().openapi({
		example: "JavaScript",
		description: "タグ名（現在の言語での名前）",
	}),
});

const ArticleSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "記事のユニークID",
	}),
	slug: z.string().openapi({
		example: "my-first-blog-post",
		description: "記事のスラッグ",
	}),
	cfImageId: z.string().nullable().openapi({
		example: "image-id-5678",
		description: "Cloudflare画像ID",
	}),
	status: z.string().openapi({
		example: "published",
		description: "記事のステータス",
	}),
	publishedAt: z.string().nullable().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "公開日時",
	}),
	updatedAt: z.string().openapi({
		example: "2024-01-02T00:00:00.000Z",
		description: "更新日時",
	}),
	title: z.string().nullable().openapi({
		example: "私の最初のブログ記事",
		description: "記事のタイトル",
	}),
	content: z.string().nullable().openapi({
		example: "これは記事の本文です...",
		description: "記事の本文",
	}),
	viewCount: z.number().int().openapi({
		example: 127,
		description: "記事の閲覧数（言語ごと）",
	}),
	tags: z.array(ArticleTagSchema).openapi({
		description: "記事に紐付いているタグ一覧",
	}),
});

const PaginationSchema = z.object({
	page: z.number().int().positive().openapi({
		example: 1,
		description: "現在のページ番号",
	}),
	limit: z.number().int().positive().openapi({
		example: 10,
		description: "1ページあたりのアイテム数",
	}),
	total: z.number().int().min(0).openapi({
		example: 100,
		description: "総アイテム数",
	}),
	totalPages: z.number().int().min(0).openapi({
		example: 10,
		description: "総ページ数",
	}),
});

const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "NOT_FOUND",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "Article not found",
			description: "エラーメッセージ",
		}),
	}),
});

const ArticlesResponseSchema = z.object({
	data: z.array(ArticleSchema),
	pagination: PaginationSchema,
});

const ArticleResponseSchema = z.object({
	data: ArticleSchema,
});

const ArticleParamSchema = z.object({
	slug: z.string().openapi({
		example: "my-first-blog-post",
		description: "記事のスラッグ",
	}),
});

const ArticleDetailQuerySchema = z.object({
	lang: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
});

const SlugCheckQuerySchema = z.object({
	slug: z.string().min(1).openapi({
		example: "my-article-slug",
		description: "チェックするスラッグ",
	}),
});

const SlugCheckResponseSchema = z.object({
	available: z.boolean().openapi({
		example: true,
		description: "スラッグが利用可能かどうか",
	}),
	message: z.string().optional().openapi({
		example: "このスラッグは既に使用されています",
		description: "メッセージ（利用不可の場合など）",
	}),
});

const ArticleCreateSchema = z.object({
	title: z.string().min(1).max(200).openapi({
		example: "新しい記事のタイトル",
		description: "記事のタイトル（1-200文字）",
	}),
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-z0-9-]+$/)
		.openapi({
			example: "new-article-slug",
			description: "記事のスラッグ（小文字の英数字とハイフンのみ、1-100文字）",
		}),
	content: z.string().min(1).openapi({
		example: "# 記事タイトル\n\nこれは記事の本文です...",
		description: "記事の本文（Markdown形式）",
	}),
	status: z.enum(["draft", "published"]).openapi({
		example: "draft",
		description: "記事のステータス",
	}),
	publishedAt: z.string().datetime().optional().openapi({
		example: "2024-01-01T10:00:00Z",
		description: "公開日時（ISO 8601形式、公開ステータス時のみ）",
	}),
	tagIds: z
		.array(z.number().int().positive())
		.min(1)
		.openapi({
			example: [1, 2, 3],
			description: "タグIDの配列（最低1つ必要）",
		}),
});

const ArticleCreateResponseSchema = z.object({
	data: ArticleSchema,
	message: z.string().openapi({
		example: "記事が正常に作成されました",
		description: "作成成功メッセージ",
	}),
});

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
		query: articlesOpenApiQuerySchema,
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
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(listArticlesRoute, async (c) => {
	try {
		// OpenAPIスキーマでクエリパラメータを取得
		const rawQuery = c.req.valid("query");

		// packages/schemasのスキーマで検証・変換
		const validatedQuery = articleListQuerySchema.parse(rawQuery);

		const {
			page,
			limit,
			language: lang,
			status,
			search,
			sortBy,
			sortOrder,
		} = validatedQuery;

		// sortOrderの型を明示的にキャスト
		const order = sortOrder as SortOrder;

		// ページネーションの計算
		const offset = (page - 1) * limit;

		// クエリ条件を構築
		const conditions = [];

		// ステータス条件
		if (status) {
			conditions.push(eq(articles.status, status));
		} else {
			// デフォルトは公開済み記事のみ
			conditions.push(eq(articles.status, "published"));
		}

		// 検索条件
		if (search) {
			conditions.push(
				sql`(
					${articleTranslations.title} LIKE ${`%${search}%`} OR 
					${articleTranslations.content} LIKE ${`%${search}%`}
				)`
			);
		}

		// 合計閲覧数を計算するサブクエリ
		const totalViewCountSubquery = db
			.select({
				articleId: articleTranslations.articleId,
				totalViewCount:
					sql<number>`COALESCE(SUM(${articleTranslations.viewCount}), 0)`.as(
						"totalViewCount"
					),
			})
			.from(articleTranslations)
			.groupBy(articleTranslations.articleId)
			.as("total_views");

		// ソート条件を設定
		let orderByClause: ReturnType<typeof asc | typeof desc>;
		switch (sortBy) {
			case "title":
				orderByClause =
					order === "asc"
						? asc(articleTranslations.title)
						: desc(articleTranslations.title);
				break;
			case "viewCount":
				orderByClause =
					order === "asc"
						? asc(totalViewCountSubquery.totalViewCount)
						: desc(totalViewCountSubquery.totalViewCount);
				break;
			case "publishedAt":
				orderByClause =
					order === "asc"
						? asc(articles.publishedAt)
						: desc(articles.publishedAt);
				break;
			case "updatedAt":
				orderByClause =
					order === "asc" ? asc(articles.updatedAt) : desc(articles.updatedAt);
				break;
			default:
				orderByClause =
					order === "asc" ? asc(articles.createdAt) : desc(articles.createdAt);
				break;
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
				viewCount: sql<number>`COALESCE(${totalViewCountSubquery.totalViewCount}, 0)`,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
			)
			.leftJoin(
				totalViewCountSubquery,
				eq(articles.id, totalViewCountSubquery.articleId)
			)
			.where(and(...conditions))
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset);

		// 総記事数を取得（同じ条件を適用）
		const totalCount = await db
			.select({ count: articles.id })
			.from(articles)
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(and(...conditions));

		// 各記事にタグを追加（一時的に空配列を設定）
		const articlesWithTags = articleList.map((article) => ({
			...article,
			tags: [] as Array<{ id: number; slug: string; name: string }>, // TODO: 実際のタグを取得するクエリを後で実装
		}));

		return c.json({
			data: articlesWithTags,
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
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(getArticleRoute, async (c) => {
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
				viewCount: sql<number>`COALESCE(${articleTranslations.viewCount}, 0)`,
				translationId: articleTranslations.id,
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

		// 3. 閲覧数をインクリメント（公開済み記事のみ）
		if (articleData.translationId) {
			await db
				.update(articleTranslations)
				.set({
					viewCount: sql`${articleTranslations.viewCount} + 1`,
				})
				.where(eq(articleTranslations.id, articleData.translationId));

			// レスポンス用に更新後の値を設定
			articleData.viewCount = (articleData.viewCount || 0) + 1;
		}

		// 4. 記事に紐付いているタグ情報を取得
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
				id: articleData.id,
				slug: articleData.slug,
				cfImageId: articleData.cfImageId,
				status: articleData.status,
				publishedAt: articleData.publishedAt,
				updatedAt: articleData.updatedAt,
				title: articleData.title,
				content: articleData.content,
				viewCount: articleData.viewCount,
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
});

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
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(checkSlugRoute, async (c) => {
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
});

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
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(createArticleRoute, async (c) => {
	try {
		const { title, slug, content, status, publishedAt } = c.req.valid("json");

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

		// タグを追加してレスポンス形式を整える
		const articleWithTags = {
			...createdArticle[0],
			tags: [] as Array<{ id: number; slug: string; name: string }>, // TODO: 実際のタグを取得するクエリを後で実装
		};

		return c.json(
			{
				data: articleWithTags,
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
});

/**
 * GET /api/articles/suggestions - サジェスト取得
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(getSuggestionsRoute, handleArticleSuggestions);
