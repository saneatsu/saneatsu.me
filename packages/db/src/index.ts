import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/index.js";

// 環境変数をロード（Node.js環境用）
dotenv.config();

/**
 * Tursoデータベースの初期化（Node.js環境用）
 * 本番環境ではTursoクラウドデータベースを使用
 * 開発環境では環境変数で制御可能
 */
const client = createClient({
	url: process.env.TURSO_DATABASE_URL || "",
	authToken: process.env.TURSO_AUTH_TOKEN || "",
});

export const db = drizzle(client, { schema });

// スキーマのエクスポート
export {
	articles,
	articleTags,
	articleTranslations,
	tags,
	tagTranslations,
	users,
} from "./schema/index.js";

// Cloudflare Workers用のエクスポート
export {
	createDatabaseClient,
	type Database,
	type DatabaseEnv,
} from "./worker.js";
