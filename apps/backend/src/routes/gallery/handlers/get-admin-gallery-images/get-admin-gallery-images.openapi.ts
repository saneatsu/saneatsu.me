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
 * ギャラリー画像一覧レスポンススキーマ
 */
const GalleryImagesResponseSchema = z.object({
	images: z.array(GalleryImageSchema),
	total: z.number().openapi({
		example: 42,
		description: "総画像数",
	}),
	page: z.number().openapi({
		example: 1,
		description: "現在のページ番号",
	}),
	limit: z.number().openapi({
		example: 20,
		description: "1ページあたりの画像数",
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
 * Admin用ギャラリー画像一覧取得のルート定義
 *
 * @description
 * GET /admin/gallery/images - Admin用ギャラリー画像一覧を取得
 *
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. クエリパラメータを取得（page、limit、sortBy、sortOrder、hasLocation、status）
 * 3. ページネーションの計算
 * 4. クエリ条件を構築（ステータス、位置情報の有無でフィルタリング）
 * 5. ソート条件を設定（createdAt、takenAt、updatedAt）
 * 6. ギャラリー画像一覧を取得
 * 7. 総画像数を取得
 * 8. レスポンスを返す
 */
export const getAdminGalleryImagesRoute = createRoute({
	method: "get",
	path: "/admin",
	request: {
		query: z.object({
			page: z.string().optional().openapi({
				example: "1",
				description: "ページ番号（デフォルト: 1）",
			}),
			limit: z.string().optional().openapi({
				example: "20",
				description: "1ページあたりの画像数（デフォルト: 20）",
			}),
			sortBy: z.enum(["createdAt", "takenAt", "updatedAt"]).optional().openapi({
				example: "createdAt",
				description: "ソート基準（デフォルト: createdAt）",
			}),
			sortOrder: z.enum(["asc", "desc"]).optional().openapi({
				example: "desc",
				description: "ソート順序（デフォルト: desc）",
			}),
			hasLocation: z.enum(["true", "false"]).optional().openapi({
				example: "true",
				description:
					"位置情報の有無でフィルタリング（true: 位置情報あり、false: 位置情報なし）",
			}),
			status: z.string().optional().openapi({
				example: "published",
				description:
					"ステータスでフィルタリング（published, draft, または published,draft のようにカンマ区切り）。指定しない場合は全てのステータスを返す。",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GalleryImagesResponseSchema,
				},
			},
			description: "ギャラリー画像一覧取得成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト",
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
	tags: ["Admin", "Gallery"],
	summary: "Admin用ギャラリー画像一覧取得",
	description:
		"ページネーション、ソート、フィルタリング機能を備えたAdmin用ギャラリー画像一覧を取得します。ステータスパラメータがない場合は全てのステータスの画像を返します。",
});
