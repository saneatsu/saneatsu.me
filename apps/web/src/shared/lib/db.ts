import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@saneatsu/db/src/schema";

/**
 * データベースクライアントを作成
 *
 * @description
 * 環境変数からデータベース接続情報を取得してクライアントを作成
 * エッジランタイムでも動作するようにlibsqlクライアントを使用
 *
 * @returns Drizzleデータベースクライアント
 */
export function createDbClient() {
	const url = process.env.TURSO_DATABASE_URL;
	const authToken = process.env.TURSO_AUTH_TOKEN;

	// ビルド時やテスト時の環境変数チェックを緩和
	if (!url || url === "") {
		console.warn("TURSO_DATABASE_URL is not set, using dummy client for build");
		// ダミークライアントを作成
		const client = createClient({
			url: "file:dummy.db",
			authToken: undefined,
		});
		return drizzle(client, { schema });
	}

	const client = createClient({
		url,
		authToken,
	});

	return drizzle(client, { schema });
}