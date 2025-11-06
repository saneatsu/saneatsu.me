import { createRoute, z } from "@hono/zod-openapi";

/**
 * 住所・施設検索のクエリパラメータスキーマ
 */
const SearchGeocodingQuerySchema = z.object({
	/**
	 * 検索クエリ（住所、地名、駅、施設など）
	 */
	q: z.string().min(1).openapi({
		example: "渋谷駅",
	}),
	/**
	 * 言語コード（ja, en）
	 */
	language: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
	}),
	/**
	 * 結果の最大数
	 */
	limit: z.string().optional().openapi({
		example: "5",
	}),
});

/**
 * Geocodingの座標スキーマ
 */
const GeocodingCoordinatesSchema = z.object({
	/**
	 * 経度
	 */
	longitude: z.number(),
	/**
	 * 緯度
	 */
	latitude: z.number(),
});

/**
 * Geocoding検索結果のスキーマ
 */
const GeocodingFeatureSchema = z.object({
	/**
	 * 場所の名前
	 */
	name: z.string(),
	/**
	 * 完全な住所
	 */
	fullAddress: z.string(),
	/**
	 * 座標（経度、緯度）
	 */
	coordinates: GeocodingCoordinatesSchema,
});

/**
 * Geocoding検索レスポンススキーマ
 */
const SearchGeocodingResponseSchema = z.object({
	/**
	 * 検索結果の配列
	 */
	features: z.array(GeocodingFeatureSchema),
});

/**
 * エラーレスポンススキーマ
 */
const ErrorResponseSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
	}),
});

/**
 * 住所・施設検索ルート定義
 *
 * @description
 * Mapbox Search Box API v1を使用して住所、地名、POI（駅、観光地など）から座標を取得する。
 *
 * @remarks
 * - 認証不要（パブリックエンドポイント）
 * - Mapbox APIキーはサーバーサイドで使用
 * - POI、住所、地名を検索可能
 */
export const searchGeocodingRoute = createRoute({
	method: "get",
	path: "/geocoding/search",
	tags: ["geocoding"],
	summary: "住所・施設から座標を検索",
	description:
		"Mapbox Search Box API v1を使用して住所、地名、POI（駅、観光地など）から座標を取得する",
	request: {
		query: SearchGeocodingQuerySchema,
	},
	responses: {
		200: {
			description: "検索成功",
			content: {
				"application/json": {
					schema: SearchGeocodingResponseSchema,
				},
			},
		},
		400: {
			description: "バリデーションエラー",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "サーバーエラー",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
