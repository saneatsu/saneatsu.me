import { createRoute, z } from "@hono/zod-openapi";

/**
 * OpenAPI用クエリパラメータスキーマ
 */
const relatedArticlesQuerySchema = z.object({
	language: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
	limit: z.string().optional().openapi({
		example: "6",
		description: "取得する記事数",
	}),
});

/**
 * タグスキーマ
 */
const TagSchema = z.object({
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
});

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
		description: "記事の閲覧数",
	}),
	tags: z.array(TagSchema).openapi({
		example: [
			{ id: 1, slug: "typescript" },
			{ id: 2, slug: "react" },
		],
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
 * 関連記事レスポンススキーマ
 */
const RelatedArticlesResponseSchema = z.object({
	data: z.array(ArticleSchema),
});

/**
 * 関連記事取得のルート定義
 */
export const getRelatedArticlesRoute = createRoute({
	method: "get",
	path: "/:slug/related",
	request: {
		params: z.object({
			slug: z.string().openapi({
				example: "my-article-slug",
				description: "記事のスラッグ",
			}),
		}),
		query: relatedArticlesQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: RelatedArticlesResponseSchema,
				},
			},
			description: "関連記事の取得成功",
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
	summary: "関連記事取得",
	description:
		"指定された記事の関連記事を取得します。同じタグを持つ記事を優先的に返し、不足する場合は最新記事で補完します。",
});
