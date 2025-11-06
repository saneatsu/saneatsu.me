import { createRoute, z } from "@hono/zod-openapi";

/**
 * 記事スキーマ（簡易版）
 */
const ArticleSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "記事ID",
	}),
	slug: z.string().openapi({
		example: "my-first-article",
		description: "記事のスラッグ",
	}),
	title: z.string().nullable().openapi({
		example: "私の最初の記事",
		description: "記事のタイトル（日本語）",
	}),
	status: z.enum(["draft", "published", "archived"]).openapi({
		example: "published",
		description: "記事のステータス",
	}),
	publishedAt: z.string().nullable().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "公開日時",
	}),
	cfImageId: z.string().nullable().openapi({
		example: "image-id-1234",
		description: "サムネイル画像のCloudflare Image ID",
	}),
	createdAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "作成日時",
	}),
});

/**
 * レスポンススキーマ
 */
const ResponseSchema = z.object({
	articles: z.array(ArticleSchema).openapi({
		description: "このギャラリー画像を使用している記事の配列",
	}),
	total: z.number().int().openapi({
		example: 5,
		description: "記事の総数",
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
			example: "Gallery image not found",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * GET /api/gallery/:id/articles - ギャラリー画像を使用している記事一覧取得
 */
export const getArticlesByGalleryImageRoute = createRoute({
	method: "get",
	path: "/:id/articles",
	request: {
		params: z.object({
			id: z.string().openapi({
				example: "1",
				description: "ギャラリー画像のID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ResponseSchema,
				},
			},
			description: "ギャラリー画像を使用している記事一覧の取得に成功",
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
			description: "ギャラリー画像が見つからない",
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
	tags: ["Gallery"],
	summary: "ギャラリー画像を使用している記事一覧取得",
	description: "指定されたギャラリー画像を使用している記事の一覧を取得します。",
});
