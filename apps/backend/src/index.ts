import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import type { Env } from "@/env";

import { articlesRoute } from "./routes/articles";
import { authRoute } from "./routes/auth/worker/worker";
import { dashboardRoute } from "./routes/dashboard";
import { galleryRoute } from "./routes/gallery";
import { geocodingRoute } from "./routes/geocoding";
import { imagesRoute } from "./routes/images";
import { ogpRoute } from "./routes/ogp";
import { tagsRoute } from "./routes/tags";

/**
 * OpenAPIHono APIサーバーの作成
 *
 * @description
 * Node.js環境とCloudflare Workers環境の両方で動作する統合APIサーバーを作成する。
 * 環境変数はc.envからアクセスし、両環境で統一されたAPIを提供する。
 *
 * TypeScriptの型推論を正しく動作させるため、チェーンメソッドパターンを使用している。
 * OpenAPIHonoインスタンスに対して後からミドルウェアやルートを追加すると、
 * その変更が型定義に反映されないため、新しい変数でチェーンメソッドを使用することで、
 * 全てのルートとミドルウェアが適用された後の完全な型をTypeScriptが推論できるようになる。
 *
 * @param options.isDevelopment - 開発環境フラグ。trueの場合、localhostとngrok-free.appを許可する
 */
export function createApp(options?: { isDevelopment?: boolean }) {
	const app = new OpenAPIHono<{ Bindings: Env }>()
		// ミドルウェアの設定
		.use("*", logger())
		.use("*", async (c, next) => {
			const corsOrigin = c.env.CORS_ORIGIN || "https://saneatsu.me";
			const origins = corsOrigin.split(",").map((o) => o.trim());

			const corsMiddleware = cors({
				origin: (origin) => {
					// 既存のオリジンリストをチェック
					if (origins.includes(origin)) {
						return origin;
					}

					// 開発環境の場合、localhostとngrokを許可
					if (options?.isDevelopment) {
						// localhost（すべてのポート）を許可
						if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
							return origin;
						}

						// ngrok-free.appを許可
						// X(Twitter)のOGPを確認する時に使用する
						// https://zenn.dev/saneatsu/articles/405dc781dfbe2e
						if (/^https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app$/.test(origin)) {
							return origin;
						}
					}

					return origins[0];
				},
				credentials: true,
				allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
				allowHeaders: ["Content-Type", "Authorization", "X-User-Email"],
			});
			return corsMiddleware(c, next);
		})
		.use("*", prettyJSON())
		// ヘルスチェックエンドポイント
		.get("/api/health", (c) => {
			const databaseUrl = c.env.TURSO_DATABASE_URL;
			const authToken = c.env.TURSO_AUTH_TOKEN;

			return c.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				service: "saneatsu-blog-api",
				runtime:
					typeof process !== "undefined" ? "node.js" : "cloudflare-workers",
				database: {
					url: databaseUrl ? "configured" : "not configured",
					hasToken: !!authToken,
				},
			});
		})
		// APIルートをマウント
		.route("/api/articles", articlesRoute)
		.route("/api/auth", authRoute)
		.route("/api/dashboard", dashboardRoute)
		.route("/api/gallery", galleryRoute)
		.route("/api", geocodingRoute)
		.route("/api/images", imagesRoute)
		.route("/api/ogp", ogpRoute)
		.route("/api/tags", tagsRoute)
		// ルートエンドポイント
		.get("/", (c) => {
			return c.json({
				message: "Welcome to saneatsu.me API",
				version: "1.0.0",
			});
		})
		// 404ハンドラー
		.notFound((c) => {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "The requested resource was not found",
					},
				},
				404
			);
		})
		// エラーハンドラー
		.onError((err, c) => {
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

	return app;
}

// 本番環境用のアプリケーションインスタンス（開発機能を無効化）
export const app = createApp();

// 型定義のエクスポート（フロントエンドのHonoクライアントで使用）
export type AppType = typeof app;

// Cloudflare Workers標準エクスポート
export default app;
