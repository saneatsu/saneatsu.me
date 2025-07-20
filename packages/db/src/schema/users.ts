import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * ユーザーテーブル
 * Google認証でログインした管理者ユーザーを管理
 */
export const users = sqliteTable("users", {
	/** ユーザーID（自動インクリメント） */
	id: integer("id").primaryKey({ autoIncrement: true }),
	/** メールアドレス（ユニーク制約） */
	email: text("email").notNull().unique(),
	/** 表示名 */
	name: text("name").notNull(),
	/** アバター画像URL */
	avatarUrl: text("avatar_url"),
	/** 認証プロバイダー（現在はgoogleのみ） */
	provider: text("provider").notNull().default("google"),
	/** プロバイダー固有のユーザーID */
	providerId: text("provider_id").notNull(),
	/** 作成日時 */
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	/** 更新日時 */
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
