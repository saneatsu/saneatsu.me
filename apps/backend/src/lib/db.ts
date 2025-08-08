import { createDatabaseClient } from "@saneatsu/db/worker";

export type DrizzleClient = ReturnType<typeof createDatabaseClient>;

/**
 * Cloudflare Workers環境用のデータベースクライアントを作成
 *
 * @description
 * Cloudflare Workersの環境変数からデータベース接続情報を取得してクライアントを作成
 * エッジランタイムでも動作するようにlibsqlクライアントを使用
 *
 * @param env - Cloudflare Workers環境変数
 * @returns Drizzleデータベースクライアント
 */
export function createDbClient(env: {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
}) {
	return createDatabaseClient(env);
}
