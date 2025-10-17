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

/**
 * エラースキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
	}),
});

/**
 * ステータス更新用のルート定義
 */
export const updateStatusRoute = createRoute({
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
					schema: ErrorSchema,
				},
			},
			description: "Bad Request",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "記事が見つかりません",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Internal Server Error",
		},
	},
	tags: ["articles"],
	summary: "記事ステータス更新",
	description: "記事のステータスを更新します。",
});
