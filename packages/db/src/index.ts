import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// 環境変数をロード（Node.js環境用）
dotenv.config();

/**
 * データベースの初期化（Node.js環境用）
 * 開発環境ではローカルSQLiteを使用
 * 本番環境ではTursoクラウドデータベースを使用
 * 
 * 注意: Cloudflare Workers環境ではこのファイルを使用せず、
 * worker.tsのエクスポートを使用してください
 */
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
	if (!_db) {
		const client = createClient({
			url:
				process.env.NODE_ENV === "production"
					? process.env.TURSO_DATABASE_URL || "file:dummy.db"
					: "file:../../packages/db/local.db",
			authToken:
				process.env.NODE_ENV === "production"
					? process.env.TURSO_AUTH_TOKEN
					: undefined,
		});
		_db = drizzle(client, { schema });
	}
	return _db;
}

// 互換性のためのエクスポート（非推奨）
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(target, prop) {
		return getDb()[prop as keyof ReturnType<typeof drizzle>];
	}
});

// スキーマのエクスポート
export {
	articles,
	articleTranslations,
	users,
} from "./schema";
// 型定義のエクスポート
export type { DrizzleClient } from "./types";
// Cloudflare Workers用のエクスポート
export {
	createDatabaseClient,
	type Database,
	type DatabaseEnv,
} from "./worker";
