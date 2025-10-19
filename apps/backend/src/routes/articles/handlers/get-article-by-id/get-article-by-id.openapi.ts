import { createRoute, z } from "@hono/zod-openapi";

/**
 * 記事スキーマ（タグ付き）
 */
const ArticleWithTagsSchema = z.object({
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
	tags: z.array(
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
	),
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
 * 管理画面用記事詳細取得のルート定義
 */
export const getArticleByIdRoute = createRoute({
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
						data: ArticleWithTagsSchema,
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
