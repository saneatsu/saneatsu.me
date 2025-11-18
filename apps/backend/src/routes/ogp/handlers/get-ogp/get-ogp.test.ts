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
				statusText: "Not Found",
			});

			// Act
			const res = await app.request("/?url=https://example.com/not-found");
			const json = await res.json();

			// Assert
			expect(res.status).toBe(500);
			expect(json).toEqual({
				error: {
					code: "OGP_FETCH_ERROR",
					message: "Failed to fetch OGP data: 404 Not Found",
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
					message: "OGP情報の取得中にエラーが発生しました。",
				},
			});
		});

		it("自サイトURLの場合、Service Bindingを使用してOGP情報を取得する", async () => {
			// Arrange
			const mockFrontendFetch = vi.fn();
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<meta property="og:title" content="saneatsu.me というサイトを作った" />
						<meta property="og:description" content="技術スタック - Next.js, TypeScript" />
						<meta property="og:image" content="https://saneatsu.me/og-image.png" />
						<meta property="og:url" content="https://saneatsu.me/ja/blog/made-this-site" />
						<meta property="og:site_name" content="saneatsu.me" />
					</head>
					<body></body>
				</html>
			`;

			mockFrontendFetch.mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml,
			});

			// Act
			const res = await app.request(
				"/?url=https://saneatsu.me/ja/blog/made-this-site",
				{},
				{
					FRONTEND_WEB: { fetch: mockFrontendFetch },
				} as unknown as Env
			);
			const json = await res.json();

			// Assert
			expect(res.status).toBe(200);
			expect(mockFrontendFetch).toHaveBeenCalledWith(
				"https://saneatsu.me/ja/blog/made-this-site",
				expect.objectContaining({
					headers: expect.any(Object),
				})
			);
			expect(mockFetch).not.toHaveBeenCalled(); // 通常のfetchは呼ばれない
			expect(json).toEqual({
				data: {
					title: "saneatsu.me というサイトを作った",
					description: "技術スタック - Next.js, TypeScript",
					image: "https://saneatsu.me/og-image.png",
					favicon: null,
					siteName: "saneatsu.me",
					url: "https://saneatsu.me/ja/blog/made-this-site",
				},
			});
		});

		it("Service Bindingが未設定の自サイトURLの場合、通常のfetchにフォールバックする", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<meta property="og:title" content="saneatsu.me" />
					</head>
					<body></body>
				</html>
			`;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: async () => mockHtml,
			});

			// Act
			// 空のenvを渡すことでFRONTEND_WEBがundefinedになる
			const res = await app.request(
				"/?url=https://saneatsu.me/ja/blog/made-this-site",
				{},
				{} as Env
			);
			const json = (await res.json()) as { data: { title: string } };

			// Assert
			expect(res.status).toBe(200);
			expect(mockFetch).toHaveBeenCalledWith(
				"https://saneatsu.me/ja/blog/made-this-site",
				expect.objectContaining({
					headers: expect.any(Object),
				})
			);
			expect(json.data.title).toBe("saneatsu.me");
		});

		it("タイムアウトした場合、504エラーを返す", async () => {
			// Arrange
			const app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getOgpRoute,
				getOgp
			);

			// AbortErrorをモック（DOMException として AbortError を生成）
			const abortError = new Error("The operation was aborted");
			abortError.name = "AbortError";
			mockFetch.mockRejectedValueOnce(abortError);

			// Act
			const res = await app.request(
				"/?url=https://example.com/",
				{},
				{} as Env
			);
			const json = await res.json();

			// Assert
			expect(res.status).toBe(504);
			expect(json).toEqual({
				error: {
					code: "OGP_FETCH_TIMEOUT",
					message: "OGP取得がタイムアウトしました。後ほど再試行してください。",
				},
			});
		});
	});
});
