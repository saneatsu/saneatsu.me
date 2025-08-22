import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	createDatabaseClient,
	tags,
} from "@saneatsu/db/worker";
import { articleListQuerySchema as ImportedArticlesQuerySchema } from "@saneatsu/schemas";
import { and, eq, not, sql } from "drizzle-orm";
import { convertWikiLinks } from "../../utils/wiki-link";

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

const ArticleUpdateSchema = z.object({
	title: z.string().min(1).max(200).openapi({
		example: "更新された記事のタイトル",
		description: "記事のタイトル（1-200文字）",
	}),
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-z0-9-]+$/)
		.openapi({
			example: "updated-article-slug",
			description: "記事のスラッグ（小文字の英数字とハイフンのみ、1-100文字）",
		}),
	content: z.string().min(1).openapi({
		example: "# 更新されたタイトル\n\nこれは更新された記事の本文です...",
		description: "記事の本文（Markdown形式）",
	}),
	status: z.enum(["draft", "published", "archived"]).openapi({
		example: "published",
		description: "記事のステータス",
	}),
	publishedAt: z.string().datetime().optional().openapi({
		example: "2024-01-01T10:00:00Z",
		description: "公開日時（ISO 8601形式、公開ステータス時のみ）",
	}),
	tagIds: z
		.array(z.number().int())
		.min(1, "少なくとも1つのタグIDが必要です")
		.max(10, "タグIDは最大10個まで")
		.openapi({
			example: [1, 2, 3],
			description: "記事に関連付けるタグのID配列（1-10個）",
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
		example: 42,
		description: "閲覧数",
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
			status,
		} = c.req.valid("query");
		const page = Number(pageStr);
		const limit = Number(limitStr);

		// ページネーションの計算
		const offset = (page - 1) * limit;

		// クエリ条件を構築
		const conditions = [];

		// ステータス条件
		if (status) {
			conditions.push(eq(articles.status, status));
		}
		// statusが指定されない場合は全記事を取得（フィルタリングなし）

		// 言語条件
		conditions.push(eq(articleTranslations.language, lang));

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
				viewCount: articleTranslations.viewCount,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.limit(limit)
			.offset(offset);

		// 総記事数を取得
		const countConditions = status ? [eq(articles.status, status)] : [];
		const totalCount = await db
			.select({ count: articles.id })
			.from(articles)
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
		console.error("Error details:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : undefined,
		});
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch articles",
					details: error instanceof Error ? error.message : String(error),
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

		// 4. Wiki Linkをコンテンツ内で変換
		const convertedContent = articleData.content
			? await convertWikiLinks(db, articleData.content, lang)
			: articleData.content;

		return c.json({
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
		console.error("Error fetching admin article:", error);
		console.error("Admin article error details:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : undefined,
		});
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch article",
					details: error instanceof Error ? error.message : String(error),
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
	description: "指定されたスラッグが既に使用されているかチェックします。",
});

/**
 * GET /api/articles/check-slug - スラッグ重複チェック
 */
articlesRoute.openapi(checkSlugRoute, async (c: any) => {
	try {
		// Cloudflare Workers環境でデータベースクライアントを初期化
		const db = createDatabaseClient(c.env);

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
		console.error("Slug check error details:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : undefined,
		});
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to check slug",
					details: error instanceof Error ? error.message : String(error),
				},
			},
			500
		);
	}
});

/**
 * 記事更新のルート定義
 */
const updateArticleRoute = createRoute({
	method: "put",
	path: "/:id",
	request: {
		params: z.object({
			id: z.string().openapi({
				example: "1",
				description: "記事のID",
			}),
		}),
		body: {
			content: {
				"application/json": {
					schema: ArticleUpdateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						data: ArticleSchema,
						message: z.string().openapi({
							example: "記事が正常に更新されました",
							description: "更新成功メッセージ",
						}),
					}),
				},
			},
			description: "記事更新成功",
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
	summary: "記事更新",
	description:
		"既存の記事を更新します。スラッグの重複チェックを行い、タグの関連付けも更新します。",
});

/**
 * ステータス更新のルート定義
 */
const updateStatusRoute = createRoute({
	method: "patch",
	path: "/:id/status",
	request: {
		params: z.object({
			id: z.string().openapi({
				example: "1",
				description: "記事のID",
			}),
		}),
		body: {
			content: {
				"application/json": {
					schema: z.object({
						status: z.enum(["draft", "published", "archived"]).openapi({
							example: "published",
							description: "記事のステータス",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						data: ArticleSchema,
						message: z.string().openapi({
							example: "記事ステータスが正常に更新されました",
							description: "更新成功メッセージ",
						}),
					}),
				},
			},
			description: "ステータス更新成功",
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
	summary: "記事ステータス更新",
	description: "記事のステータスのみを更新します。",
});

/**
 * PUT /api/articles/:id - 記事更新
 */
articlesRoute.openapi(updateArticleRoute, async (c: any) => {
	try {
		// Cloudflare Workers環境でデータベースクライアントを初期化
		const db = createDatabaseClient(c.env);

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

		// 1. 既存記事の存在確認
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

		// 2. スラッグの重複チェック（自分自身は除外）
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

		// 3. 記事データを更新
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

		// 4. 翻訳データを更新（日本語のみ）
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

		// 5. タグとの関連付けを更新
		// 既存のタグ関連を削除
		await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

		// 新しいタグ関連を作成
		if (tagIds && tagIds.length > 0) {
			await db.insert(articleTags).values(
				tagIds.map((tagId: number) => ({
					articleId,
					tagId,
				}))
			);
		}

		// 6. レスポンス用のデータを取得
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

		return c.json({
			data: updatedArticle[0],
			message: "記事が正常に更新されました",
		});
	} catch (error) {
		console.error("Error updating article:", error);
		console.error("Article update error details:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : undefined,
		});
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update article",
					details: error instanceof Error ? error.message : String(error),
				},
			},
			500
		);
	}
});

/**
 * PATCH /api/articles/:id/status - 記事ステータス更新
 */
articlesRoute.openapi(updateStatusRoute, async (c: any) => {
	try {
		// packages/db経由でDBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		const { id } = c.req.valid("param");
		const { status } = c.req.valid("json");

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

		// 1. 既存記事の存在確認
		const existingArticle = await db
			.select({
				id: articles.id,
				status: articles.status,
				publishedAt: articles.publishedAt,
			})
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

		// 2. ステータスを更新
		const now = new Date().toISOString();
		let finalPublishedAt = existingArticle[0].publishedAt;

		// statusがpublishedに変更される場合、publishedAtが未設定なら現在時刻を設定
		if (status === "published" && !existingArticle[0].publishedAt) {
			finalPublishedAt = now;
		}
		// statusがdraftまたはarchivedに変更される場合、publishedAtをnullにする
		else if (status === "draft" || status === "archived") {
			finalPublishedAt = null;
		}

		await db
			.update(articles)
			.set({
				status,
				publishedAt: finalPublishedAt,
				updatedAt: now,
			})
			.where(eq(articles.id, articleId));

		// 3. 更新後の記事を取得
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

		return c.json({
			data: updatedArticle[0],
			message: "記事ステータスが正常に更新されました",
		});
	} catch (error) {
		console.error("Error updating article status:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update article status",
				},
			},
			500
		);
	}
});
