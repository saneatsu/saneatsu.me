import { createRoute, z } from "@hono/zod-openapi";

/**
 * 記事更新リクエストスキーマ
 */
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
	content: z
		.string()
		.min(1)
		.refine(
			(content) => {
				// コードブロックを除外してからチェック
				const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "");
				// H1見出し（行頭 + # + スペース + #以外）をチェック
				return !/(^|\n)#\s+(?!#)/m.test(contentWithoutCodeBlocks);
			},
			{
				message:
					"記事本文でH1見出し（# 1個）は使用できません。H2（##）以降を使用してください。",
			}
		)
		.openapi({
			example: "## 更新されたタイトル\n\nこれは更新された記事の本文です...",
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
});

/**
 * 警告スキーマ
 */
const WarningSchema = z.object({
	code: z.string().openapi({
		example: "TRANSLATION_FAILED",
		description: "警告コード",
	}),
	message: z.string().openapi({
		example: "英語への翻訳に失敗しました",
		description: "警告メッセージ",
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
 * 記事更新のルート定義
 */
export const updateArticleRoute = createRoute({
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
						warnings: z.array(WarningSchema).optional().openapi({
							description:
								"警告メッセージの配列（翻訳失敗などの非致命的なエラー）",
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
