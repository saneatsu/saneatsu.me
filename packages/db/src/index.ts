/**
 * データベースモジュール（Node.js環境専用）
 *
 * 重要: Cloudflare Workers環境では '@saneatsu/db/worker' を使用してください
 *
 * このファイルはNode.js環境でのみ動作します。
 * Cloudflare Workers環境では実行時エラーが発生します。
 */

// スキーマのエクスポート（Cloudflare Workersでも安全）
export {
	articles,
	articleTranslations,
	users,
} from "./schema";

// 型定義のエクスポート（Cloudflare Workersでも安全）
export type { DrizzleClient } from "./types";

// Node.js環境でのみ動作するDB接続
// この関数はCloudflare Workersビルド時には評価されない
function createNodeDb() {
	const { createClient } = require("@libsql/client");
	const { drizzle } = require("drizzle-orm/libsql");
	const schema = require("./schema");
	const dotenv = require("dotenv");

	dotenv.config();

	const client = createClient({
		url:
			process.env.NODE_ENV === "production"
				? process.env.TURSO_DATABASE_URL || ""
				: "file:../../packages/db/local.db",
		authToken:
			process.env.NODE_ENV === "production"
				? process.env.TURSO_AUTH_TOKEN
				: undefined,
	});

	return drizzle(client, { schema });
}

// 遅延初期化用の変数
// biome-ignore lint/suspicious/noExplicitAny: DB instance type varies by environment
let _dbInstance: any = null;

// Proxyを使って実際にアクセスされるまで初期化を遅延
// biome-ignore lint/suspicious/noExplicitAny: Proxy pattern requires dynamic typing
export const db = new Proxy({} as any, {
	// biome-ignore lint/correctness/noUnusedFunctionParameters: Proxy handler signature
	get(target, prop) {
		// Cloudflare Workers環境チェック
		if (
			typeof globalThis !== "undefined" &&
			"WorkerGlobalScope" in globalThis
		) {
			throw new Error(
				"Database connection error: This module is for Node.js environments only. " +
					"In Cloudflare Workers, please use '@saneatsu/db/worker' instead."
			);
		}

		// Node.js環境でのみDB接続を初期化
		if (!_dbInstance) {
			_dbInstance = createNodeDb();
		}

		return _dbInstance[prop];
	},
});
