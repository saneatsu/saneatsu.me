import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { articlesRoute } from "./routes/articles";
import { authRoute } from "./routes/auth/worker/worker";
import { dashboardRoute } from "./routes/dashboard";
import { tagsRoute } from "./routes/tags";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	CORS_ORIGIN: string;
	ADMIN_EMAILS?: string;
	TEST_DATABASE_URL?: string;
};

/**
 * OpenAPIHono APIサーバーの初期化
 *
 * @description
 * Node.js環境とCloudflare Workers環境の両方で動作する統合APIサーバー。
 * 環境変数はc.envからアクセスし、両環境で統一されたAPIを提供する。
 */
const app = new OpenAPIHono<{ Bindings: Env }>();

// ミドルウェアの設定
app.use("*", logger());
app.use("*", async (c, next) => {
	const corsOrigin =
		c.env.CORS_ORIGIN || "http://localhost:3333,https://saneatsu.me";
	const origins = corsOrigin.split(",").map((o) => o.trim());

	const corsMiddleware = cors({
		origin: origins,
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-User-Email"],
	});
	return corsMiddleware(c, next);
});
app.use("*", prettyJSON());

// ヘルスチェックエンドポイント
app.get("/api/health", (c) => {
	const databaseUrl = c.env.TURSO_DATABASE_URL;
	const authToken = c.env.TURSO_AUTH_TOKEN;

	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		service: "saneatsu-blog-api",
		runtime: typeof process !== "undefined" ? "node.js" : "cloudflare-workers",
		database: {
			url: databaseUrl ? "configured" : "not configured",
			hasToken: !!authToken,
		},
	});
});

// APIルートをマウント
app.route("/api/articles", articlesRoute);
app.route("/api/auth", authRoute);
app.route("/api/dashboard", dashboardRoute);
app.route("/api/tags", tagsRoute);

// ルートエンドポイント
app.get("/", (c) => {
	return c.json({
		message: "Welcome to saneatsu.me API",
		version: "1.0.0",
	});
});

// 404ハンドラー
app.notFound((c) => {
	return c.json(
		{
			error: {
				code: "NOT_FOUND",
				message: "The requested resource was not found",
			},
		},
		404
	);
});

// エラーハンドラー
app.onError((err, c) => {
	console.error("Server error:", err);
	return c.json(
		{
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "An internal server error occurred",
			},
		},
		500
	);
});

// 型定義のエクスポート（フロントエンドのHonoクライアントで使用）
export type AppType = typeof app;

// テスト用にappもエクスポート
export { app };

// Cloudflare Workers標準エクスポート
export default app;
