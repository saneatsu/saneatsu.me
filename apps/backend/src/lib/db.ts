import { createDatabaseClient } from "@saneatsu/db/worker";

import type { Env } from "@/env";

export type DrizzleClient = ReturnType<typeof createDatabaseClient>;

/**
 * Env型から必要なデータベース接続情報のプロパティだけをピック
 *
 * @description
 * Env型の変更が自動的にDatabaseEnvに反映されるようにする
 */
type DatabaseEnv = Pick<Env, "TURSO_DATABASE_URL" | "TURSO_AUTH_TOKEN">;

/**
 * Cloudflare Workers環境用のデータベースクライアントを作成
 *
 * @description
 * Cloudflare Workersの環境変数からデータベース接続情報を取得してクライアントを作成
 * エッジランタイムでも動作するようにlibsqlクライアントを使用
 *
 * @param env - Cloudflare Workers環境変数（c.env全体を渡す）
 * @returns Drizzleデータベースクライアント
 */
export function createDbClient(env: DatabaseEnv) {
	return createDatabaseClient(env);
}
