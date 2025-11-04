import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "@/env";

import { searchGeocodingHandler } from "./search-geocoding";
import { searchGeocodingRoute } from "./search-geocoding.openapi";

// グローバルfetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const mockEnv: Env = {
	TURSO_DATABASE_URL: "test-db-url",
	TURSO_AUTH_TOKEN: "test-auth-token",
	CLOUDFLARE_ACCOUNT_ID: "test-account-id",
	CLOUDFLARE_API_TOKEN: "test-token",
	CLOUDFLARE_ACCOUNT_HASH: "test-hash",
	GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
	MAPBOX_ACCESS_TOKEN: "test-mapbox-token",
	NODE_ENV: "development",
};

describe("Unit Test", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/geocoding/search - ジオコーディング検索", () => {
		it("住所検索に成功した場合、座標データを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				searchGeocodingRoute,
				searchGeocodingHandler
			);

			// Mapbox APIのレスポンスをモック
			const mockMapboxResponse = {
				type: "FeatureCollection",
				features: [
					{
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [139.7014, 35.6895],
						},
						properties: {
							name: "渋谷区",
							full_address: "東京都渋谷区",
							place_formatted: "東京都渋谷区",
						},
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockMapboxResponse,
			});

			// Act
			const res = await app.request(
				"/geocoding/search?q=東京都渋谷区&language=ja&limit=5",
				{},
				mockEnv
			);
			const json = await res.json();

			// Assert
			expect(res.status).toBe(200);
			expect(json).toEqual({
				features: [
					{
						name: "渋谷区",
						fullAddress: "東京都渋谷区",
						coordinates: {
							longitude: 139.7014,
							latitude: 35.6895,
						},
					},
				],
			});

			// fetchが正しいURLで呼ばれたことを確認
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					"https://api.mapbox.com/search/geocode/v6/forward"
				)
			);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					"q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%B8%8B%E8%B0%B7%E5%8C%BA"
				)
			);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("access_token=test-mapbox-token")
			);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("language=ja")
			);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=5")
			);
		});

		it("複数の検索結果を正しく変換する", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				searchGeocodingRoute,
				searchGeocodingHandler
			);

			const mockMapboxResponse = {
				type: "FeatureCollection",
				features: [
					{
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [139.7014, 35.6895],
						},
						properties: {
							name: "Shibuya",
							full_address: "Shibuya, Tokyo, Japan",
						},
					},
					{
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [139.7671, 35.6812],
						},
						properties: {
							place_formatted: "Shinjuku, Tokyo, Japan",
						},
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockMapboxResponse,
			});

			// Act
			const res = await app.request("/geocoding/search?q=Tokyo", {}, mockEnv);
			const json = (await res.json()) as any;

			// Assert
			expect(res.status).toBe(200);
			expect(json.features).toHaveLength(2);
			expect(json.features[0]).toEqual({
				name: "Shibuya",
				fullAddress: "Shibuya, Tokyo, Japan",
				coordinates: {
					longitude: 139.7014,
					latitude: 35.6895,
				},
			});
			expect(json.features[1]).toEqual({
				name: "Shinjuku, Tokyo, Japan",
				fullAddress: "Shinjuku, Tokyo, Japan",
				coordinates: {
					longitude: 139.7671,
					latitude: 35.6812,
				},
			});
		});

		it("limitパラメータが無効な場合、400エラーを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				searchGeocodingRoute,
				searchGeocodingHandler
			);

			// Act
			const res = await app.request(
				"/geocoding/search?q=東京&limit=20",
				{},
				mockEnv
			);
			const json = await res.json();

			// Assert
			expect(res.status).toBe(400);
			expect(json).toEqual({
				error: {
					code: "INVALID_LIMIT",
					message: "limitは1から10の間の数値である必要があります。",
				},
			});

			// fetchが呼ばれていないことを確認
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("Mapbox APIがエラーを返した場合、500エラーを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				searchGeocodingRoute,
				searchGeocodingHandler
			);

			mockFetch.mockResolvedValueOnce({
				ok: false,
				text: async () => "Mapbox API error",
			});

			// Act
			const res = await app.request("/geocoding/search?q=東京", {}, mockEnv);
			const json = await res.json();

			// Assert
			expect(res.status).toBe(500);
			expect(json).toEqual({
				error: {
					code: "MAPBOX_API_ERROR",
					message: "Mapbox APIからエラーが返されました。",
				},
			});
		});

		it("ネットワークエラーが発生した場合、500エラーを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				searchGeocodingRoute,
				searchGeocodingHandler
			);

			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			// Act
			const res = await app.request("/geocoding/search?q=東京", {}, mockEnv);
			const json = await res.json();

			// Assert
			expect(res.status).toBe(500);
			expect(json).toEqual({
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "住所検索中にエラーが発生しました。",
				},
			});
		});

		it("デフォルトパラメータで動作する", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				searchGeocodingRoute,
				searchGeocodingHandler
			);

			const mockMapboxResponse = {
				type: "FeatureCollection",
				features: [],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockMapboxResponse,
			});

			// Act
			const res = await app.request("/geocoding/search?q=test", {}, mockEnv);

			// Assert
			expect(res.status).toBe(200);

			// デフォルト値が使われていることを確認
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("language=ja")
			);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=5")
			);
		});
	});
});
