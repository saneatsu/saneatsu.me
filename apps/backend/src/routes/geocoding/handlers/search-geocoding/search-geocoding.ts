import type { RouteHandler } from "@hono/zod-openapi";

import type { Env } from "@/env";

import type { searchGeocodingRoute } from "./search-geocoding.openapi";

/**
 * Mapbox Search Box API v1のレスポンス型定義
 */
type MapboxSearchBoxResponse = {
	type: "FeatureCollection";
	features: Array<{
		type: "Feature";
		geometry: {
			type: "Point";
			coordinates: [number, number]; // [longitude, latitude]
		};
		properties: {
			name?: string;
			full_address?: string;
			place_formatted?: string;
		};
	}>;
};

type Handler = RouteHandler<typeof searchGeocodingRoute, { Bindings: Env }>;

/**
 * 住所・施設検索ハンドラー
 *
 * @description
 * 1. クエリパラメータを取得
 * 2. Mapbox Search Box API v1を呼び出し（住所、地名、POIを検索）
 * 3. レスポンスを変換して返す
 *
 * @remarks
 * - Mapbox APIキーは環境変数から取得
 * - 結果はGeoJSON形式から独自形式に変換
 * - POI（駅、観光地、ランドマーク）、住所、地名を検索可能
 */
export const searchGeocodingHandler: Handler = async (c) => {
	const query = c.req.valid("query");
	const q = query.q;
	const language = query.language || "ja";
	const limitStr = query.limit || "5";

	// limitを数値に変換してバリデーション
	const limit = Number.parseInt(limitStr, 10);
	if (Number.isNaN(limit) || limit < 1 || limit > 10) {
		return c.json(
			{
				error: {
					code: "INVALID_LIMIT",
					message: "limitは1から10の間の数値である必要があります。",
				},
			},
			400
		);
	}

	try {
		// Mapbox Search Box API v1のエンドポイント
		const mapboxUrl = new URL(
			"https://api.mapbox.com/search/searchbox/v1/forward"
		);

		// クエリパラメータを設定
		mapboxUrl.searchParams.set("q", q);
		mapboxUrl.searchParams.set("access_token", c.env.MAPBOX_ACCESS_TOKEN);
		mapboxUrl.searchParams.set("language", language);
		mapboxUrl.searchParams.set("limit", limit.toString());

		// Mapbox APIを呼び出し
		const response = await fetch(mapboxUrl.toString());

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Mapbox API error:", errorText);

			return c.json(
				{
					error: {
						code: "MAPBOX_API_ERROR",
						message: "Mapbox APIからエラーが返されました。",
					},
				},
				500
			);
		}

		const data = (await response.json()) as MapboxSearchBoxResponse;

		// レスポンスを変換
		const features = data.features.map((feature) => ({
			name: feature.properties.name || feature.properties.place_formatted || "",
			fullAddress:
				feature.properties.full_address ||
				feature.properties.place_formatted ||
				"",
			coordinates: {
				longitude: feature.geometry.coordinates[0],
				latitude: feature.geometry.coordinates[1],
			},
		}));

		return c.json({ features }, 200);
	} catch (error) {
		console.error("Geocoding search error:", error);

		return c.json(
			{
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "住所検索中にエラーが発生しました。",
				},
			},
			500
		);
	}
};
