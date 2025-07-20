import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
	console.log("🔗 Turso接続テストを開始します...");
	console.log("URL:", process.env.TURSO_DATABASE_URL);
	console.log("Token exists:", !!process.env.TURSO_AUTH_TOKEN);

	try {
		const client = createClient({
			url: process.env.TURSO_DATABASE_URL || "",
			authToken: process.env.TURSO_AUTH_TOKEN || "",
		});

		const result = await client.execute(
			"SELECT name FROM sqlite_master WHERE type='table';"
		);
		console.log("✅ 接続成功！テーブル一覧:");
		result.rows.forEach((row) => console.log("  -", row.name));
	} catch (error) {
		console.error("❌ 接続エラー:", error);
	}
}

testConnection();
