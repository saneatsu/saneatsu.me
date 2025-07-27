import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "./schema";

/**
 * Drizzleデータベースクライアントの型定義
 */
export type DrizzleClient = LibSQLDatabase<typeof schema>;
