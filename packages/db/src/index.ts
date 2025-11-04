/**
 * データベースモジュール（Node.js環境専用）
 *
 * 重要: Cloudflare Workers環境では '@saneatsu/db/worker' を使用してください
 *
 * このファイルはNode.js環境でのみ動作します。
 * Cloudflare Workers環境では実行時エラーが発生します。
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// スキーマのエクスポート（Cloudflare Workersでも安全）
export {
	articles,
	articleTags,
	articleTranslations,
	dailyArticleViews,
	galleryImages,
	galleryImageTranslations,
	tags,
	tagTranslations,
	users,
} from "./schema";

// 型定義のエクスポート（Cloudflare Workersでも安全）
export type { DrizzleClient } from "./types";

// Cloudflare Workers環境の型定義（worker.tsと互換性のため）
type DatabaseEnv = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
};

// Node.js環境でのみ動作するDB接続（レガシー用）
// この関数はCloudflare Workersビルド時には評価されない
function createNodeDb() {
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

/**
 * Node.js環境用のデータベースクライアント作成関数
 * worker.tsの createDatabaseClient と互換性のあるインターフェース
 *
 * @param env - データベース接続情報
 * @returns Drizzle ORMインスタンス
 */
export function createDatabaseClient(env: DatabaseEnv) {
	// ローカルファイルの場合は認証トークンを省略
	const isLocalFile = env.TURSO_DATABASE_URL?.startsWith("file:");

	const client = createClient({
		url: env.TURSO_DATABASE_URL,
		authToken: isLocalFile ? undefined : env.TURSO_AUTH_TOKEN,
	});

	return drizzle(client, { schema });
}

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
