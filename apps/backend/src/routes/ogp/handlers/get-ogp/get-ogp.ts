import type { RouteHandler } from "@hono/zod-openapi";
import ogs from "open-graph-scraper";

import type { Env } from "@/env";

import type { getOgpRoute } from "./get-ogp.openapi";

type Handler = RouteHandler<typeof getOgpRoute, { Bindings: Env }>;

/**
 * GET /api/ogp - OGP情報取得
 *
 * @description
 * 1. クエリパラメータからURLを取得
 * 2. open-graph-scraperを使用してOGP情報を取得
 * 3. 取得したOGP情報を整形してレスポンス
 * 4. エラーハンドリング（無効なURL、取得失敗）
 */
export const getOgp: Handler = async (c) => {
	try {
		// 1. クエリパラメータからURLを取得
		const { url } = c.req.valid("query");

		// 2. open-graph-scraperを使用してOGP情報を取得
		const { result, error } = await ogs({ url });

		if (error) {
			return c.json(
				{
					error: {
						code: "OGP_FETCH_ERROR",
						message: "Failed to fetch OGP data from the provided URL",
					},
				},
				500
			);
		}

		// 3. 取得したOGP情報を整形してレスポンス
		return c.json(
			{
				data: {
					title:
						result.ogTitle || result.dcTitle || result.twitterTitle || null,
					description:
						result.ogDescription ||
						result.dcDescription ||
						result.twitterDescription ||
						null,
					image:
						result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
					favicon: result.favicon || null,
					siteName: result.ogSiteName || null,
					url: result.ogUrl || url,
				},
			},
			200
		);
	} catch (err) {
		// 4. エラーハンドリング
		console.error("OGP fetch error:", err);
		return c.json(
			{
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An error occurred while fetching OGP data",
				},
			},
			500
		);
	}
};
