import { createRoute, z } from "@hono/zod-openapi";

/**
 * スラッグチェッククエリスキーマ
 */
const SlugCheckQuerySchema = z.object({
	slug: z.string().min(1).openapi({
		example: "my-article-slug",
		description: "チェックするスラッグ",
	}),
});

/**
 * スラッグチェックレスポンススキーマ
 */
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
 * スラッグ重複チェックのルート定義
 */
export const checkSlugRoute = createRoute({
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
