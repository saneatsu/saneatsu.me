import { createRoute, z } from "@hono/zod-openapi";

/**
 * タグ作成リクエストスキーマ
 */
const TagCreateSchema = z.object({
	slug: z
		.string()
		.min(1, "スラッグは必須です")
		.max(100, "スラッグは100文字以内で入力してください")
		.regex(/^[a-z0-9-]+$/, "スラッグは小文字の英数字とハイフンのみ使用できます")
		.openapi({
			example: "typescript",
			description: "タグのスラッグ（小文字の英数字とハイフンのみ、1-100文字）",
		}),
});

/**
 * タグスキーマ
 */
const TagSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "タグのユニークID",
	}),
	slug: z.string().openapi({
		example: "typescript",
		description: "タグのスラッグ",
	}),
	createdAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "作成日時",
	}),
	updatedAt: z.string().openapi({
		example: "2024-01-02T00:00:00.000Z",
		description: "更新日時",
	}),
});

/**
 * タグ作成レスポンススキーマ
 */
const TagCreateResponseSchema = z.object({
	data: TagSchema,
	message: z.string().openapi({
		example: "タグが正常に作成されました",
		description: "作成成功メッセージ",
	}),
});

/**
 * エラースキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "SLUG_ALREADY_EXISTS",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "このスラッグは既に使用されています",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * タグ作成のルート定義
 */
export const createTagRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: TagCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: TagCreateResponseSchema,
				},
			},
			description: "タグ作成成功",
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
	tags: ["Tags"],
	summary: "タグ作成",
	description: "新しいタグを作成します。",
});
