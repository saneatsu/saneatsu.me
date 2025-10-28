import { createRoute, z } from "@hono/zod-openapi";

/**
 * 記事スキーマ
 */
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
	status: z.enum(["draft", "published", "archived"]).openapi({
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
	tags: z
		.array(
			z.object({
				id: z.number().int().openapi({
					example: 1,
					description: "タグID",
				}),
				slug: z.string().openapi({
					example: "typescript",
					description: "タグスラッグ",
				}),
				createdAt: z.string().openapi({
					example: "2024-01-01T00:00:00.000Z",
					description: "作成日時",
				}),
				updatedAt: z.string().openapi({
					example: "2024-01-01T00:00:00.000Z",
					description: "更新日時",
				}),
				articleCount: z.number().int().openapi({
					example: 0,
					description: "このタグが付けられた記事の数",
				}),
				translations: z.object({
					ja: z.string().openapi({
						example: "TypeScript",
						description: "日本語のタグ名",
					}),
					en: z.string().openapi({
						example: "TypeScript",
						description: "英語のタグ名",
					}),
				}),
			})
		)
		.openapi({
			description: "記事に関連付けられたタグ",
		}),
});

/**
 * エラースキーマ
 */
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

/**
 * 記事詳細レスポンススキーマ
 */
const ArticleResponseSchema = z.object({
	data: ArticleSchema,
});

/**
 * 記事パラメータスキーマ
 */
const ArticleParamSchema = z.object({
	slug: z.string().openapi({
		example: "my-first-blog-post",
		description: "記事のスラッグ",
	}),
});

/**
 * 記事詳細クエリスキーマ
 */
const ArticleDetailQuerySchema = z.object({
	lang: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
});

/**
 * 記事詳細取得のルート定義
 */
export const getArticleRoute = createRoute({
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
