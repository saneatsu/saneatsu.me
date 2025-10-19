import { createRoute, z } from "@hono/zod-openapi";

/**
 * パラメータスキーマ
 */
const ParamsSchema = z.object({
	id: z.string().openapi({
		param: {
			name: "id",
			in: "path",
		},
		example: "1",
		description: "タグのID",
	}),
});

/**
 * リクエストボディスキーマ
 */
const TagUpdateSchema = z.object({
	name: z
		.string()
		.min(1, "タグ名は必須です")
		.max(100, "タグ名は100文字以内で入力してください")
		.openapi({
			example: "タイプスクリプト",
			description: "タグの表示名（日本語）",
		}),
	enName: z
		.string()
		.min(1, "英語のタグ名は1文字以上である必要があります")
		.max(100, "英語のタグ名は100文字以内で入力してください")
		.optional()
		.openapi({
			example: "TypeScript",
			description: "タグの表示名（英語）。未指定の場合は自動翻訳されます。",
		}),
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
 * レスポンススキーマ
 */
const TagUpdateResponseSchema = z.object({
	data: z.object({
		id: z.number().openapi({ example: 1, description: "タグのID" }),
		slug: z
			.string()
			.openapi({ example: "typescript", description: "タグのスラッグ" }),
		createdAt: z.string().openapi({
			example: "2024-01-01T00:00:00.000Z",
			description: "作成日時",
		}),
		updatedAt: z.string().openapi({
			example: "2024-01-02T00:00:00.000Z",
			description: "更新日時",
		}),
	}),
	message: z.string().openapi({
		example: "タグが正常に更新されました",
		description: "成功メッセージ",
	}),
});

/**
 * エラーレスポンススキーマ
 */
const ErrorResponseSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "NOT_FOUND",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "Tag not found",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * PUT /api/tags/:id ルート定義
 */
export const updateTagRoute = createRoute({
	method: "put",
	path: "/:id",
	tags: ["tags"],
	summary: "タグ更新",
	description: "指定されたIDのタグを更新します",
	request: {
		params: ParamsSchema,
		body: {
			content: {
				"application/json": {
					schema: TagUpdateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagUpdateResponseSchema,
				},
			},
			description: "タグ更新成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "無効なリクエスト",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "タグが見つかりません",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "スラッグが既に使用されています",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
});
