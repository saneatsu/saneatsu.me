import { createRoute, z } from "@hono/zod-openapi";

/**
 * ギャラリー画像削除レスポンススキーマ
 */
const GalleryImageDeleteResponseSchema = z.object({
	message: z.string().openapi({
		example: "ギャラリー画像が正常に削除されました",
		description: "削除成功メッセージ",
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
 * ギャラリー画像削除のルート定義
 *
 * @description
 * DELETE /gallery/images/:id - ギャラリー画像を削除
 *
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータから画像IDを取得
 * 3. 画像の存在確認と cfImageId の取得
 * 4. Cloudflare Imagesから画像を削除
 * 5. DBから画像レコードを削除
 * 6. レスポンスを返す
 */
export const deleteGalleryImageRoute = createRoute({
	method: "delete",
	path: "/:id",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "1",
				description: "削除するギャラリー画像のID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GalleryImageDeleteResponseSchema,
				},
			},
			description: "ギャラリー画像削除成功",
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
	tags: ["Gallery"],
	summary: "ギャラリー画像削除",
	description:
		"Cloudflare ImagesとDBから指定されたギャラリー画像を削除します。",
});
