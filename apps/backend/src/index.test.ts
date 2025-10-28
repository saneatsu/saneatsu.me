import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppType } from "./index";

// 環境変数のモック
vi.mock("dotenv", () => ({
	default: {
		config: vi.fn(),
	},
}));

// サーバーの起動をモック
vi.mock("@hono/node-server", () => ({
	serve: vi.fn(),
}));

// ルートのモック
vi.mock("./routes/articles", () => {
	const { OpenAPIHono } = require("@hono/zod-openapi");
	return {
		articlesRoute: new OpenAPIHono(),
	};
});

vi.mock("./routes/tags", () => {
	const { OpenAPIHono } = require("@hono/zod-openapi");
	return {
		tagsRoute: new OpenAPIHono(),
	};
});

describe("Unit Test", () => {
	let app: AppType;
	const testEnv = {
		TURSO_DATABASE_URL: "file:./test.db",
		TURSO_AUTH_TOKEN: "test-token",
		CORS_ORIGIN: "http://localhost:3333,https://saneatsu.me",
	};

	beforeEach(async () => {
		// 環境変数を設定
		process.env.TURSO_DATABASE_URL = "file:./test.db";
		process.env.TURSO_AUTH_TOKEN = "test-token";

		// viのモックをリセット
		vi.resetModules();

		// モジュールを動的にインポート（モックが適用された状態で）
		const module = await import("./index");
		app = module.app;
	});

	describe("GET /", () => {
		it("ルートエンドポイントが正しいレスポンスを返す", async () => {
			// Act
			// @ts-expect-error testClientはAppTypeのルート定義を完全に推論できないため
			const res = await testClient(app, testEnv).$get({});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "Welcome to saneatsu.me API",
				version: "1.0.0",
			});
		});
	});

	describe("GET /api/health", () => {
		it("ヘルスチェックエンドポイントが正しいレスポンスを返す", async () => {
			// Act
			const res = await testClient(app, testEnv).api.health.$get({});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data).toMatchObject({
				status: "ok",
				service: "saneatsu-blog-api",
				runtime: "node.js",
				database: {
					url: "configured",
					hasToken: true,
				},
			});
			expect(data.timestamp).toBeDefined();
			expect(new Date(data.timestamp)).toBeInstanceOf(Date);
		});
	});

	describe("404 Handler", () => {
		it("存在しないルートへのアクセスで404エラーを返す", async () => {
			// Act
			// @ts-expect-error 404ハンドラーのテストのため意図的に存在しないルートにアクセス
			const res = await testClient(app, testEnv).api["non-existent-route"].$get(
				{}
			);

			// Assert
			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "NOT_FOUND",
					message: "The requested resource was not found",
				},
			});
		});
	});

	describe("Error Handler", () => {
		it("サーバーエラーが発生した場合に500エラーを返す", async () => {
			// Arrange
			// エラーをスローするカスタムルートを追加
			app.get("/api/error-test", () => {
				throw new Error("Test error");
			});

			// Act
			// @ts-expect-error テスト用に動的に追加したルートのため型定義に存在しない
			const res = await testClient(app, testEnv).api["error-test"].$get({});

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An internal server error occurred",
				},
			});
		});
	});
});

describe("Integration Test", () => {
	let app: AppType;
	const testEnv = {
		TURSO_DATABASE_URL: "file:./test.db",
		TURSO_AUTH_TOKEN: "test-token",
		CORS_ORIGIN: "http://localhost:3333,https://saneatsu.me",
	};

	beforeEach(async () => {
		// 環境変数を設定
		process.env.TURSO_DATABASE_URL = "file:./test.db";
		process.env.TURSO_AUTH_TOKEN = "test-token";

		// viのモックをリセット
		vi.resetModules();
		vi.clearAllMocks();

		// モジュールを動的にインポート
		const module = await import("./index");
		app = module.app;
	});

	describe("Middleware", () => {
		it("CORSヘッダーが正しく設定される", async () => {
			// Act
			// @ts-expect-error testClientはAppTypeのルート定義を完全に推論できないため
			const res = await testClient(app, testEnv).$get({});

			// Assert
			expect(res.headers.get("access-control-allow-origin")).toBeDefined();
		});

		it("JSON形式のレスポンスがpretty printされる", async () => {
			// Act
			const res = await testClient(app, testEnv).api.health.$get({});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			// ヘルスチェックのレスポンスが正しい形式であることを確認
			expect(data).toHaveProperty("status", "ok");
			expect(data).toHaveProperty("service", "saneatsu-blog-api");
			expect(data).toHaveProperty("runtime", "node.js");
			expect(data).toHaveProperty("timestamp");
			expect(data).toHaveProperty("database");
		});
	});
});
