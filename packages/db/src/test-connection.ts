import { createClient } from "@libsql/client";

import { env } from "./env";

async function testConnection() {
	console.log("🔗 Turso接続テストを開始します...");
	console.log("URL:", env.TURSO_DATABASE_URL ?? "file:./local.db");
	console.log("Token exists:", !!env.TURSO_AUTH_TOKEN);

	try {
		const url = env.TURSO_DATABASE_URL ?? "file:./local.db";
		const authToken = url.startsWith("file:")
			? undefined
			: env.TURSO_AUTH_TOKEN;

		const client = createClient({
			url,
			authToken: authToken || "",
		});

		const result = await client.execute(
			"SELECT name FROM sqlite_master WHERE type='table';"
		);
		console.log("✅ 接続成功！テーブル一覧:");
		for (const row of result.rows) {
			console.log("  -", row.name);
		}
	} catch (error) {
		console.error("❌ 接続エラー:", error);
	}
}

testConnection();
