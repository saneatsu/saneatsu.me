import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Cloudflare Workers用のTursoデータベース接続
 *
 * @description
 * Cloudflare Workers環境でTursoデータベースに接続するためのヘルパー関数。
 * 環境変数はWorkers環境のBindingsから取得する。
 */

// Cloudflare Workers環境の型定義
type DatabaseEnv = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
};

/**
 * Cloudflare Workers環境でデータベースクライアントを初期化
 *
 * @param env - Cloudflare Workersの環境変数
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

// スキーマのエクスポート（既存のindex.tsと同じ）
export {
	articles,
	articleTags,
	articleTranslations,
	tags,
	tagTranslations,
	users,
} from "./schema";

// 型定義のエクスポート
export type Database = ReturnType<typeof createDatabaseClient>;
export type { DatabaseEnv };
