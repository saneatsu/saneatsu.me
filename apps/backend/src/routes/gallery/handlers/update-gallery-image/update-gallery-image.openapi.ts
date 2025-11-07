import { createRoute, z } from "@hono/zod-openapi";

/**
 * 翻訳データスキーマ
 */
const TranslationSchema = z.object({
	language: z.enum(["ja", "en"]).openapi({
		example: "ja",
		description: "言語コード",
	}),
	title: z.string().optional().openapi({
		example: "東京タワーの夕景",
		description: "画像のタイトル（オプショナル）",
	}),
	description: z.string().optional().openapi({
		example: "2024年12月に東京タワーを訪れた際に撮影した写真",
		description: "画像の説明（オプショナル）",
	}),
});

/**
 * ギャラリー画像更新リクエストスキーマ（JSON）
 */
const GalleryImageUpdateSchema = z.object({
	translations: z.array(TranslationSchema).optional().openapi({
		description:
			"画像の翻訳データ（オプショナル）。指定された言語の翻訳を上書きまたは追加します。",
	}),
	latitude: z.number().min(-90).max(90).optional().openapi({
		example: 35.6585805,
		description: "撮影場所の緯度（-90から90、オプショナル）",
	}),
	longitude: z.number().min(-180).max(180).optional().openapi({
		example: 139.7454329,
		description: "撮影場所の経度（-180から180、オプショナル）",
	}),
	takenAt: z.string().datetime().optional().openapi({
		example: "2024-12-01T15:30:00Z",
		description: "撮影日時（ISO 8601形式、オプショナル）",
	}),
	status: z.enum(["published", "draft"]).optional().openapi({
		example: "published",
		description:
			"画像の公開ステータス（published: 公開済み, draft: 下書き、オプショナル）",
	}),
});

/**
 * ギャラリー画像更新リクエストスキーマ（FormData）
 */
const GalleryImageUpdateFormDataSchema = z.object({
	file: z.any().optional().openapi({
		type: "string",
		format: "binary",
		description:
			"置き換える画像ファイル（JPEG/PNG/GIF/WebP、最大10MB、オプショナル）",
	}),
	translations: z.string().optional().openapi({
		example: '[{"language":"ja","title":"東京タワーの夕景"}]',
		description:
			"画像の翻訳データ（JSON文字列、オプショナル）。指定された言語の翻訳を上書きまたは追加します。",
	}),
	latitude: z.string().optional().openapi({
		example: "35.6585805",
		description: "撮影場所の緯度（-90から90、オプショナル）",
	}),
	longitude: z.string().optional().openapi({
		example: "139.7454329",
		description: "撮影場所の経度（-180から180、オプショナル）",
	}),
	takenAt: z.string().optional().openapi({
		example: "2024-12-01T15:30:00Z",
		description: "撮影日時（ISO 8601形式、オプショナル）",
	}),
	status: z.string().optional().openapi({
		example: "published",
		description:
			"画像の公開ステータス（published: 公開済み, draft: 下書き、オプショナル）",
	}),
});

/**
 * ギャラリー画像レスポンススキーマ
 */
const GalleryImageSchema = z.object({
	id: z.number(),
	cfImageId: z.string(),
	translations: z.array(
		z.object({
			id: z.number(),
			galleryImageId: z.number(),
			language: z.enum(["ja", "en"]),
			title: z.string().nullable(),
			description: z.string().nullable(),
			createdAt: z.string(),
			updatedAt: z.string(),
		})
	),
	latitude: z.number().nullable(),
	longitude: z.number().nullable(),
	takenAt: z.string().nullable(),
	status: z.enum(["published", "draft"]),
	createdAt: z.string(),
	updatedAt: z.string(),
});

/**
 * ギャラリー画像更新レスポンススキーマ
 */
const GalleryImageUpdateResponseSchema = z.object({
	data: GalleryImageSchema,
	message: z.string().openapi({
		example: "ギャラリー画像が正常に更新されました",
		description: "更新成功メッセージ",
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
 * ギャラリー画像更新のルート定義
 *
 * @description
 * PATCH /gallery/images/:id - ギャラリー画像を更新
 *
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータから画像IDを取得
 * 3. リクエストボディを取得（FormDataまたはJSON）
 * 4. 画像の存在確認
 * 5. ファイルが提供されている場合、画像を置き換える
 * 6. 画像情報を更新
 * 7. レスポンスを返す
 */
export const updateGalleryImageRoute = createRoute({
	method: "patch",
	path: "/:id",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "1",
				description: "更新するギャラリー画像のID",
			}),
		}),
		body: {
			content: {
				"application/json": {
					schema: GalleryImageUpdateSchema,
				},
				"multipart/form-data": {
					schema: GalleryImageUpdateFormDataSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GalleryImageUpdateResponseSchema,
				},
			},
			description: "ギャラリー画像更新成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description:
				"不正なリクエスト（IDが不正、ファイルサイズ超過、ファイル形式が不正など）",
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
	summary: "ギャラリー画像更新",
	description:
		"既存のギャラリー画像のメタデータ（タイトル、説明、位置情報、撮影日時）を更新します。multipart/form-dataでファイルを送信すると、画像ファイル自体も置き換えることができます（最大10MB、JPEG/PNG/GIF/WebP形式）。",
});
