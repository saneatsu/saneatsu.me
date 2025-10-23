import { createRoute, z } from "@hono/zod-openapi";

/**
 * 閲覧数推移用のOpenAPIクエリスキーマ
 */
const viewsTrendOpenApiQuerySchema = z.object({
	language: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "統計データを取得する言語",
	}),
	days: z.string().optional().openapi({
		example: "30",
		description: "表示期間（30、90、180、360日）",
	}),
});

/**
 * 閲覧数推移データポイントスキーマ
 */
const viewsTrendDataPointOpenApiSchema = z.object({
	date: z.string().openapi({
		example: "2024-01-15",
		description: "日付（YYYY-MM-DD形式）",
	}),
	views: z.number().int().openapi({
		example: 156,
		description: "その日の総閲覧数",
	}),
});

/**
 * 閲覧数推移レスポンススキーマ
 */
const viewsTrendOpenApiResponseSchema = z.object({
	data: z.array(viewsTrendDataPointOpenApiSchema).openapi({
		description: "指定期間の日別閲覧数データ",
	}),
	startDate: z.string().openapi({
		example: "2024-01-01",
		description: "データの開始日",
	}),
	endDate: z.string().openapi({
		example: "2024-01-31",
		description: "データの終了日",
	}),
	totalViews: z.number().int().openapi({
		example: 4567,
		description: "期間中の総閲覧数",
	}),
	lastUpdated: z.string().datetime().openapi({
		example: "2024-01-31T12:00:00Z",
		description: "統計の最終更新日時",
	}),
});

/**
 * エラースキーマ
 */
const errorSchema = z.object({
	error: z.string().openapi({
		example: "閲覧数推移データの取得に失敗しました",
		description: "エラーメッセージ",
	}),
});

/**
 * 閲覧数推移取得のルート定義
 */
export const getViewsTrendRoute = createRoute({
	method: "get",
	path: "/views-trend",
	request: {
		query: viewsTrendOpenApiQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: viewsTrendOpenApiResponseSchema,
				},
			},
			description: "閲覧数推移データ",
		},
		500: {
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Dashboard"],
	summary: "閲覧数推移取得",
	description: "指定期間の日別閲覧数推移を取得します",
});
