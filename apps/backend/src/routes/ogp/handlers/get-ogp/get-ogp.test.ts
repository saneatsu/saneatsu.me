import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "@/env";

import { getOgp } from "./get-ogp";
import { getOgpRoute } from "./get-ogp.openapi";

// グローバルfetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("Unit Test", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/ogp - OGP情報取得", () => {
		it("OGP情報の取得に成功した場合、OGPデータを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			// fetchのモックを設定
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<meta property="og:title" content="React Query との併用" />
						<meta property="og:description" content="Feature-Sliced Designアーキテクチャでのデータ取得とキャッシュ管理について" />
						<meta property="og:image" content="https://feature-sliced.github.io/og-image.png" />
						<meta property="og:url" content="https://feature-sliced.github.io/" />
						<meta property="og:site_name" content="Feature-Sliced Design" />
						<link rel="icon" href="https://feature-sliced.github.io/favicon.ico" />
					</head>
					<body></body>
				</html>
			`;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml,
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

			// fetchのモックを設定（OGP情報なし）
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>Example Page</title>
					</head>
					<body></body>
				</html>
			`;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml,
			});

			// Act
			const res = await app.request("/?url=https://example.com/");
			const json = await res.json();

			// Assert
			expect(res.status).toBe(200);
			expect(json).toEqual({
				data: {
					title: "Example Page",
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

			// fetchのモックを設定（エラー）
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

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

			// fetchのモックを設定（例外発生）
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

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
