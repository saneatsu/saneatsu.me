import { createRoute, z } from "@hono/zod-openapi";

/**
 * ギャラリー画像翻訳スキーマ
 */
const GalleryImageTranslationSchema = z.object({
	id: z.number(),
	galleryImageId: z.number(),
	language: z.enum(["ja", "en"]),
	title: z.string().nullable(),
	description: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

/**
 * ギャラリー画像レスポンススキーマ
 */
const GalleryImageSchema = z.object({
	id: z.number(),
	cfImageId: z.string(),
	translations: z.array(GalleryImageTranslationSchema),
	latitude: z.number().nullable(),
	longitude: z.number().nullable(),
	takenAt: z.string().nullable(),
	status: z.enum(["published", "draft"]),
	createdAt: z.string(),
	updatedAt: z.string(),
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
 * ギャラリー画像詳細取得のルート定義
 *
 * @description
 * GET /gallery/:id - ギャラリー画像の詳細を取得
 *
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. パスパラメータからidを取得
 * 3. ギャラリー画像を取得
 * 4. 画像が存在しない場合は404エラー
 * 5. 翻訳データを取得
 * 6. 言語パラメータが指定されている場合、その言語の翻訳のみを返す
 * 7. レスポンスを返す
 */
export const getGalleryImageByIdRoute = createRoute({
	method: "get",
	path: "/:id",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "1",
				description: "ギャラリー画像ID",
			}),
		}),
		query: z.object({
			language: z.enum(["ja", "en"]).optional().openapi({
				example: "ja",
				description:
					"言語指定（オプショナル）。指定された場合、その言語の翻訳のみを返す",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GalleryImageSchema,
				},
			},
			description: "ギャラリー画像詳細取得成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト（IDが不正等）",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "ギャラリー画像が見つかりません",
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
	summary: "ギャラリー画像詳細取得",
	description: "指定されたIDのギャラリー画像の詳細情報を取得します。",
});
