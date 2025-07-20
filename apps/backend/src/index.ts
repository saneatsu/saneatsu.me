import dotenv from "dotenv";

// 環境変数をロード
dotenv.config();

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { articlesRoute } from "./routes/articles";
import { tagsRoute } from "./routes/tags";

/**
 * Hono APIサーバーの初期化
 */
const app = new Hono();

// ミドルウェアの設定
app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

// ヘルスチェックエンドポイント
app.get("/api/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		service: "saneatsu-blog-api",
		database: {
			url: process.env.TURSO_DATABASE_URL,
			hasToken: !!process.env.TURSO_AUTH_TOKEN,
		},
	});
});

// APIルートをマウント
app.route("/api/articles", articlesRoute);
app.route("/api/tags", tagsRoute);

// ルートエンドポイント
app.get("/", (c) => {
	return c.json({
		message: "Welcome to Saneatsu Blog API",
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

const port = 3001;
console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port,
});
