import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { articlesRoute } from "./routes/articles/worker";
import { authRoute } from "./routes/auth/worker";

/**
 * Cloudflare Workers用のHonoアプリケーション
 *
 * @description
 * Node.js環境から移行したCloudflare Workers版のAPIサーバー。
 * 環境変数はc.envからアクセスし、標準のWorkersエクスポートを使用。
 */

// Cloudflare Workers環境の型定義
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	CORS_ORIGIN: string;
	ADMIN_EMAILS?: string;
};

// OpenAPIHono APIサーバーの初期化（環境変数型を指定）
const app = new OpenAPIHono<{ Bindings: Env }>();

// ミドルウェアの設定
app.use("*", logger());
app.use("*", async (c, next) => {
	const corsOrigin = c.env.CORS_ORIGIN || "https://saneatsu.me";
	const corsMiddleware = cors({
		origin: corsOrigin,
		credentials: true,
	});
	return corsMiddleware(c, next);
});
app.use("*", prettyJSON());

// ヘルスチェックエンドポイント
app.get("/api/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		service: "saneatsu-blog-api",
		runtime: "cloudflare-workers",
		database: {
			url: c.env.TURSO_DATABASE_URL ? "configured" : "not configured",
			hasToken: !!c.env.TURSO_AUTH_TOKEN,
		},
	});
});

// APIルートをマウント
app.route("/api/articles", articlesRoute);
app.route("/api/auth", authRoute);

// ルートエンドポイント
app.get("/", (c) => {
	return c.json({
		message: "Welcome to saneatsu.me API",
		version: "1.0.0",
		runtime: "cloudflare-workers",
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

// Cloudflare Workers標準エクスポート
export default app;
