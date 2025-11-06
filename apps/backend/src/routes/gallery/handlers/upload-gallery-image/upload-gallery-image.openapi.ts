import { createRoute, z } from "@hono/zod-openapi";

/**
 * ギャラリー画像アップロードレスポンススキーマ
 */
const GalleryImageUploadResponseSchema = z.object({
	id: z.number().openapi({
		example: 1,
		description: "ギャラリー画像ID（DB上のID）",
	}),
	imageId: z.string().openapi({
		example: "2cdc28f0-017a-49c4-9ed7-87056c83901f",
		description: "Cloudflare ImagesにアップロードされたImage ID",
	}),
	imageUrl: z.string().url().openapi({
		example:
			"https://imagedelivery.net/abc123/2cdc28f0-017a-49c4-9ed7-87056c83901f/original",
		description: "画像配信URL（originalバリアント）",
	}),
	message: z.string().openapi({
		example: "ギャラリー画像が正常にアップロードされました",
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
 * ギャラリー画像アップロードのルート定義
 *
 * @description
 * POST /gallery/images - ギャラリー画像をアップロード
 *
 * 処理フロー:
 * 1. multipart/form-dataからfile、titleJa、descriptionJa、latitude、longitude、takenAtを取得
 * 2. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
 * 3. ファイルサイズバリデーション（10MB以下）
 * 4. ファイル形式バリデーション（JPEG/PNG/GIF/WebP）
 * 5. Gemini APIで日本語テキストを英語に翻訳
 * 6. Cloudflare Imagesにアップロード
 * 7. DBに画像情報を保存（日本語と英語の翻訳データ）
 * 8. 画像URL（originalバリアント）を生成して返す
 */
export const uploadGalleryImageRoute = createRoute({
	method: "post",
	path: "/",
	request: {
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
						titleJa: z.string().optional().openapi({
							example: "東京タワーの夕景",
							description:
								"画像のタイトル（日本語）。Gemini APIで自動的に英語に翻訳される。",
						}),
						descriptionJa: z.string().optional().openapi({
							example: "2024年12月に東京タワーを訪れた際に撮影した写真",
							description:
								"画像の説明（日本語）。Gemini APIで自動的に英語に翻訳される。",
						}),
						latitude: z.string().optional().openapi({
							example: "35.6585805",
							description: "撮影場所の緯度（オプショナル）",
						}),
						longitude: z.string().optional().openapi({
							example: "139.7454329",
							description: "撮影場所の経度（オプショナル）",
						}),
						takenAt: z.string().optional().openapi({
							example: "2024-12-01T15:30:00Z",
							description: "撮影日時（ISO 8601形式、オプショナル）",
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
					schema: GalleryImageUploadResponseSchema,
				},
			},
			description: "ギャラリー画像アップロード成功",
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
	tags: ["Gallery"],
	summary: "ギャラリー画像アップロード",
	description:
		"位置情報付きのギャラリー画像をCloudflare Imagesにアップロードし、DBに保存します。日本語のタイトルと説明をGemini APIで自動的に英語に翻訳します。最大10MB、JPEG/PNG/GIF/WebP形式に対応しています。",
});
