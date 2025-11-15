/**
 * 開発環境専用のエントリーポイント
 *
 * このファイルは開発環境（pnpm dev）でのみ使用されます。
 * 本番環境（Cloudflare Workers）では、index.tsが直接使用されます。
 *
 * ## なぜdev.tsとindex.tsの2つが必要なのか？
 *
 * ### 1. 環境ごとの実行方式の違い
 * - 開発環境: Node.js + @hono/node-server（このファイル）
 * - 本番環境: Cloudflare Workers（index.ts）
 *
 * ### 2. 起動方法の違い
 * - 開発環境: Node.jsサーバーを明示的に起動する必要がある
 * - 本番環境: Cloudflare Workersが自動的にfetchハンドラーを呼び出す
 *
 * ### 3. 共通のAPIロジック
 * index.tsからAPIアプリケーションをインポートすることで、
 * ビジネスロジックを共有しながら環境固有の設定を分離
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";

import type { Env } from "./env";
import { createApp } from "./index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
const { error } = dotenv.config({ path: envPath });

if (error) {
	console.error("❌ Failed to load apps/backend/.env", error);
	process.exit(1);
}

// 環境変数のバリデーション（開発環境用）
// dotenvで読み込んだ値を使って@t3-oss/env-coreの検証を実行する
const { env: validatedEnv } = await import("./env");

// 開発環境専用の設定（localhost全ポートとngrok-free.appを許可）
const app = createApp({ isDevelopment: true });

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8888;

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
	fetch: (request) => {
		const mergedEnv = {
			...process.env,
			...validatedEnv,
		} satisfies Env & NodeJS.ProcessEnv;
		return app.fetch(request, mergedEnv);
	},
	port,
});
