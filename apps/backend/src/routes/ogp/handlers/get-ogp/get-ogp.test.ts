import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it, vi } from "vitest";

import type { Env } from "@/env";

import { getOgp } from "./get-ogp";
import { getOgpRoute } from "./get-ogp.openapi";

// open-graph-scraperをモック
vi.mock("open-graph-scraper", () => ({
	default: vi.fn(),
}));

describe("Unit Test", () => {
	describe("GET /api/ogp - OGP情報取得", () => {
		it("OGP情報の取得に成功した場合、OGPデータを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			// open-graph-scraperのモックを設定
			const ogs = await import("open-graph-scraper");
			vi.mocked(ogs.default).mockResolvedValueOnce({
				error: false,
				result: {
					ogTitle: "React Query との併用",
					ogDescription:
						"Feature-Sliced Designアーキテクチャでのデータ取得とキャッシュ管理について",
					ogImage: [
						{
							url: "https://feature-sliced.github.io/og-image.png",
						},
					],
					ogUrl: "https://feature-sliced.github.io/",
					ogSiteName: "Feature-Sliced Design",
					favicon: "https://feature-sliced.github.io/favicon.ico",
				},
				html: "<html></html>",
				response: {
					statusCode: 200,
					url: "https://feature-sliced.github.io/",
				},
			});

			// Act
			const res = await app.request("/?url=https://feature-sliced.github.io/");
			const json = await res.json();

			// Assert
			expect(res.status).toBe(200);
			expect(json).toEqual({
				data: {
					title: "React Query との併用",
					description:
						"Feature-Sliced Designアーキテクチャでのデータ取得とキャッシュ管理について",
					image: "https://feature-sliced.github.io/og-image.png",
					favicon: "https://feature-sliced.github.io/favicon.ico",
					siteName: "Feature-Sliced Design",
					url: "https://feature-sliced.github.io/",
				},
			});
		});

		it("OGP情報が取得できない場合、null値を返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			// open-graph-scraperのモックを設定（OGP情報なし）
			const ogs = await import("open-graph-scraper");
			vi.mocked(ogs.default).mockResolvedValueOnce({
				error: false,
				result: {},
				html: "<html></html>",
				response: {
					statusCode: 200,
					url: "https://example.com/",
				},
			});

			// Act
			const res = await app.request("/?url=https://example.com/");
			const json = await res.json();

			// Assert
			expect(res.status).toBe(200);
			expect(json).toEqual({
				data: {
					title: null,
					description: null,
					image: null,
					favicon: null,
					siteName: null,
					url: "https://example.com/",
				},
			});
		});

		it("OGP取得に失敗した場合、エラーを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			// open-graph-scraperのモックを設定（エラー）
			const ogs = await import("open-graph-scraper");
			const errorDetails = new Error("Page not found");
			errorDetails.name = "PageNotFoundError";
			vi.mocked(ogs.default).mockResolvedValueOnce({
				error: true,
				result: {
					error: "Page not found",
					errorDetails: errorDetails,
				},
			} as any);

			// Act
			const res = await app.request("/?url=https://example.com/not-found");
			const json = await res.json();

			// Assert
			expect(res.status).toBe(500);
			expect(json).toEqual({
				error: {
					code: "OGP_FETCH_ERROR",
					message: "Failed to fetch OGP data from the provided URL",
				},
			});
		});

		it("例外が発生した場合、適切にエラーハンドリングする", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			// open-graph-scraperのモックを設定（例外発生）
			const ogs = await import("open-graph-scraper");
			vi.mocked(ogs.default).mockRejectedValueOnce(new Error("Network error"));

			// Act
			const res = await app.request("/?url=https://example.com/");
			const json = await res.json();

			// Assert
			expect(res.status).toBe(500);
			expect(json).toEqual({
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An error occurred while fetching OGP data",
				},
			});
		});
	});
});
