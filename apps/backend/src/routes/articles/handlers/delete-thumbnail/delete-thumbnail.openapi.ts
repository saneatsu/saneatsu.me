import { createRoute, z } from "@hono/zod-openapi";

/**
 * サムネイル画像削除レスポンススキーマ
 */
const ThumbnailDeleteResponseSchema = z.object({
	message: z.string().openapi({
		example: "サムネイル画像が正常に削除されました",
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
			example: "Article not found",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * サムネイル画像削除のルート定義
 *
 * @description
 * DELETE /articles/:id/thumbnail - サムネイル画像を削除
 *
 * 処理フロー:
 * 1. 記事IDで記事を取得
 * 2. 記事が存在しない場合は404エラー
 * 3. cfImageIdがnullの場合は404エラー（削除する画像がない）
 * 4. Cloudflare Imagesから画像を削除
 * 5. DBのcfImageIdをnullに更新
 * 6. 成功メッセージを返す
 */
export const deleteThumbnailRoute = createRoute({
	method: "delete",
	path: "/{id}/thumbnail",
	request: {
		params: z.object({
			id: z
				.string()
				.regex(/^\d+$/)
				.openapi({
					param: {
						name: "id",
						in: "path",
					},
					example: "1",
					description: "記事ID",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ThumbnailDeleteResponseSchema,
				},
			},
			description: "サムネイル画像削除成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "記事が見つからない、または画像が存在しない",
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
	summary: "サムネイル画像削除",
	description:
		"記事のサムネイル画像をCloudflare Imagesから削除します。DBのcfImageIdもnullに更新されます。",
});
