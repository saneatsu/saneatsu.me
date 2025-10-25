import { createRoute, z } from "@hono/zod-openapi";

/**
 * 画像アップロードレスポンススキーマ
 */
const ImageUploadResponseSchema = z.object({
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
		example: "画像が正常にアップロードされました",
		description: "アップロード成功メッセージ",
	}),
});

/**
 * エラースキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "INVALID_REQUEST",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "ファイルが指定されていません",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * 汎用画像アップロードのルート定義
 *
 * @description
 * POST /images - 汎用画像をアップロード
 *
 * 処理フロー:
 * 1. multipart/form-dataからfileを取得
 * 2. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
 * 3. ファイルサイズバリデーション（10MB以下）
 * 4. ファイル形式バリデーション（JPEG/PNG/GIF/WebP）
 * 5. Cloudflare Imagesにアップロード
 * 6. 画像URL（mediumバリアント）を生成して返す
 */
export const uploadImageRoute = createRoute({
	method: "post",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ImageUploadResponseSchema,
				},
			},
			description: "画像アップロード成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト（ファイルが存在しない、サイズ超過等）",
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
	summary: "汎用画像アップロード",
	description:
		"Markdownエディタなどで使用する汎用画像をCloudflare Imagesにアップロードします。最大10MB、JPEG/PNG/GIF/WebP形式に対応しています。",
});
