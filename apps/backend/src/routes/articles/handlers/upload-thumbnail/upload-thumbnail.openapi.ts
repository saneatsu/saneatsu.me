import { createRoute, z } from "@hono/zod-openapi";

/**
 * サムネイル画像アップロードレスポンススキーマ
 */
const ThumbnailUploadResponseSchema = z.object({
	imageId: z.string().openapi({
		example: "2cdc28f0-017a-49c4-9ed7-87056c83901f",
		description: "Cloudflare ImagesにアップロードされたImage ID",
	}),
	imageUrl: z.string().url().openapi({
		example:
			"https://imagedelivery.net/abc123/2cdc28f0-017a-49c4-9ed7-87056c83901f/medium",
		description: "画像配信URL（mediumバリアント）",
	}),
	message: z.string().openapi({
		example: "サムネイル画像が正常にアップロードされました",
		description: "アップロード成功メッセージ",
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
 * サムネイル画像アップロードのルート定義
 *
 * @description
 * POST /articles/:id/thumbnail - サムネイル画像をアップロード
 *
 * 処理フロー:
 * 1. 記事IDで記事を取得
 * 2. 記事が存在しない場合は404エラー
 * 3. multipart/form-dataからfileを取得
 * 4. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
 * 5. 既存のcfImageIdがある場合、古い画像を削除
 * 6. Cloudflare Imagesにアップロード
 * 7. DBのcfImageIdを更新
 * 8. 画像URL（mediumバリアント）を生成して返す
 */
export const uploadThumbnailRoute = createRoute({
	method: "post",
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
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						file: z.any().openapi({
							type: "string",
							format: "binary",
							description:
								"アップロードする画像ファイル（JPEG/PNG/GIF/WebP、最大10MB）",
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
					schema: ThumbnailUploadResponseSchema,
				},
			},
			description: "サムネイル画像アップロード成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト（ファイルが存在しない等）",
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
			description: "サーバーエラー",
		},
	},
	tags: ["Articles"],
	summary: "サムネイル画像アップロード",
	description:
		"記事のサムネイル画像をCloudflare Imagesにアップロードします。既存の画像がある場合は削除されます。",
});
