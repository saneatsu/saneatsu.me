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
 * レスポンススキーマ
 */
const TagDeleteResponseSchema = z.object({
	message: z.string().openapi({
		example: "タグが正常に削除されました",
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
 * DELETE /api/tags/:id ルート定義
 */
export const deleteTagRoute = createRoute({
	method: "delete",
	path: "/:id",
	tags: ["tags"],
	summary: "タグ削除",
	description:
		"指定されたIDのタグを削除します。関連する記事タグの紐づけも削除されます。",
	request: {
		params: ParamsSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagDeleteResponseSchema,
				},
			},
			description: "タグ削除成功",
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
