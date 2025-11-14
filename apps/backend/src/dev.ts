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

import { serve } from "@hono/node-server";
import { createApp } from "./index";

// 環境変数のバリデーション（開発環境用）
// env.tsで@t3-oss/env-coreによるバリデーションを実行する
// 必須の環境変数が設定されていない場合はここでエラーが投げられる
await import("./env");

// 開発環境専用の設定（localhost全ポートとngrok-free.appを許可）
const app = createApp({ isDevelopment: true });

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8888;

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
	fetch: (request, env) => {
		// Node.js環境でprocess.envをc.envに渡す
		return app.fetch(request, { ...process.env, ...env });
	},
	port,
});
