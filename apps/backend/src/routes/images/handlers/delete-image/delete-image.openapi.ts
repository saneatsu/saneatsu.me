import { createRoute, z } from "@hono/zod-openapi";

/**
 * 画像削除レスポンススキーマ
 */
const ImageDeleteResponseSchema = z.object({
	message: z.string().openapi({
		example: "画像が正常に削除されました",
		description: "削除成功メッセージ",
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
			example: "画像が見つかりません",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * 汎用画像削除のルート定義
 *
 * @description
 * DELETE /images/:imageId - 汎用画像を削除
 *
 * 処理フロー:
 * 1. パスパラメータからimageIdを取得
 * 2. Cloudflare Imagesから画像を削除
 * 3. レスポンスを返す
 */
export const deleteImageRoute = createRoute({
	method: "delete",
	path: "/{imageId}",
	request: {
		params: z.object({
			imageId: z.string().openapi({
				param: {
					name: "imageId",
					in: "path",
				},
				example: "2cdc28f0-017a-49c4-9ed7-87056c83901f",
				description: "削除する画像のCloudflare Images ID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ImageDeleteResponseSchema,
				},
			},
			description: "画像削除成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "画像が見つかりません",
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
	tags: ["Images"],
	summary: "汎用画像削除",
	description:
		"指定されたImage IDの画像をCloudflare Imagesから削除します。削除された画像はすべてのVariantsを含めて完全に削除されます。",
});
