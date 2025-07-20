import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * SQLiteデータベースの初期化
 * 開発環境ではローカルのsqlite.dbを使用
 */
const sqlite = new Database("./sqlite.db");
export const db = drizzle(sqlite, { schema });

// スキーマのエクスポート
export * from "./schema";
