import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	tags,
} from "@saneatsu/db/worker";
import { articleListQuerySchema, type SortOrder } from "@saneatsu/schemas";
import { and, asc, desc, eq, not, sql } from "drizzle-orm";
import { createTranslationService } from "../../services/gemini-translation";
import { convertWikiLinks } from "../../utils/wiki-link";
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
		.array(z.number().int())
		.max(10, "タグIDは最大10個まで")
		.optional()
		.openapi({
			example: [1, 2, 3],
			description: "記事に関連付けるタグのID配列（最大10個、省略可能）",
		}),
});

const ArticleCreateResponseSchema = z.object({
	data: ArticleSchema,
	message: z.string().openapi({
		example: "記事が正常に作成されました",
		description: "作成成功メッセージ",
	}),
});

// Cloudflare Workers環境の型定義
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string; // Gemini API key（オプション）
};

/**
 * 記事関連のAPIルート
 */
export const articlesRoute = new OpenAPIHono<{ Bindings: Env }>();

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
		// packages/db経由でDBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

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
		}
		// statusが指定されない場合は全記事を取得（フィルタリングなし）

		// 検索条件
		if (search) {
			conditions.push(
				sql`(
					${articleTranslations.title} LIKE ${`%${search}%`} OR 
					${articleTranslations.content} LIKE ${`%${search}%`}
				)`
			);
		}

		// 一時的にサブクエリを削除してシンプルなクエリでテスト

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
				// 一時的にviewCountソートは無効化
				orderByClause =
					order === "asc" ? asc(articles.createdAt) : desc(articles.createdAt);
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

		// 記事一覧を取得（JOINあり、サブクエリなし）
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
				viewCount: sql<number>`0`, // 一時的に固定値（後でサブクエリを復元予定）
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
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
 * GET /api/articles/suggestions - サジェスト取得
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(getSuggestionsRoute, handleArticleSuggestions);

/**
 * GET /api/articles/check-slug - スラッグ重複チェック
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(checkSlugRoute, async (c) => {
	try {
		// packages/db経由でDBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

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
 * GET /api/articles/:slug - 記事詳細取得
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(getArticleRoute, async (c) => {
	try {
		// packages/db経由でDBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

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
		params: z.object({
			id: z.string().openapi({
				example: "1",
				description: "記事のID",
			}),
		}),
		query: z.object({
			lang: z.enum(["ja", "en"]).optional().default("ja").openapi({
				example: "ja",
				description: "言語",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						data: ArticleSchema.extend({
							tags: z.array(
								z.object({
									id: z.number().int(),
									slug: z.string(),
									name: z.string().nullable(),
								})
							),
						}),
					}),
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
	summary: "管理画面用記事詳細取得",
	description:
		"管理画面で使用する記事詳細を取得します。ステータスに関わらず取得可能です。",
});

/**
 * GET /api/articles/admin/:id - 管理画面用記事詳細取得
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(getArticleByIdRoute, async (c) => {
	try {
		// packages/db経由でDBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

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
		// packages/db経由でDBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

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

		// 4. 英語への自動翻訳を実行（非同期）
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

		// 5. タグとの関連付けを実装（tagIdsが提供された場合）
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
		.max(10, "タグIDは最大10個まで")
		.optional()
		.openapi({
			example: [1, 2, 3],
			description: "記事に関連付けるタグのID配列（最大10個、省略可能）",
		}),
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

// ステータス更新用のスキーマ
const updateStatusRoute = createRoute({
	method: "patch",
	path: "/:id/status",
	request: {
		params: z.object({
			id: z.string().openapi({
				description: "記事ID",
				example: "1",
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
						message: z.string(),
					}),
				},
			},
			description: "記事ステータス更新成功",
		},
		400: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.string(),
							message: z.string(),
						}),
					}),
				},
			},
			description: "Bad Request",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.string(),
							message: z.string(),
						}),
					}),
				},
			},
			description: "記事が見つかりません",
		},
		500: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.string(),
							message: z.string(),
						}),
					}),
				},
			},
			description: "Internal Server Error",
		},
	},
	tags: ["articles"],
});

/**
 * PUT /api/articles/:id - 記事更新
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(updateArticleRoute, async (c) => {
	try {
		// packages/db経由でDBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

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

		// 4. 翻訳データを更新（日本語）
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

		// 5. 英語への自動翻訳を実行
		if (c.env.GEMINI_API_KEY) {
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				// 既存の英語翻訳を確認
				const existingEnTranslation = await db
					.select({
						id: articleTranslations.id,
						title: articleTranslations.title,
						content: articleTranslations.content,
					})
					.from(articleTranslations)
					.where(
						and(
							eq(articleTranslations.articleId, articleId),
							eq(articleTranslations.language, "en")
						)
					)
					.limit(1);

				// 翻訳を実行
				const translatedArticle = await translationService.translateArticle(
					title,
					content
				);

				if (translatedArticle) {
					if (existingEnTranslation.length > 0) {
						// 既存の英語翻訳を更新
						await db
							.update(articleTranslations)
							.set({
								title: translatedArticle.title,
								content: translatedArticle.content,
							})
							.where(eq(articleTranslations.id, existingEnTranslation[0].id));
						console.log(`Article ${articleId} translation updated`);
					} else {
						// 新規に英語翻訳を作成
						await db.insert(articleTranslations).values({
							articleId,
							language: "en",
							title: translatedArticle.title,
							content: translatedArticle.content,
						});
						console.log(`Article ${articleId} translated for the first time`);
					}
				} else {
					console.warn(
						`Translation failed for article ${articleId}, continuing without translation`
					);
				}
			} catch (error) {
				// 翻訳エラーが発生してもメインの処理は続行
				console.error(`Translation error for article ${articleId}:`, error);
			}
		} else {
			console.log("GEMINI_API_KEY not configured, skipping translation");
		}

		// 6. タグとの関連付けを更新
		// 既存のタグ関連を削除
		await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

		// 新しいタグ関連を作成
		if (tagIds && tagIds.length > 0) {
			await db.insert(articleTags).values(
				tagIds.map((tagId) => ({
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
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update article",
				},
			},
			500
		);
	}
});

/**
 * PATCH /api/articles/:id/status - 記事ステータス更新
 */
// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
articlesRoute.openapi(updateStatusRoute, async (c) => {
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
