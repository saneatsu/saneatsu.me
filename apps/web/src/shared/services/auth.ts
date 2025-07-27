import { eq } from "drizzle-orm";
import { users, type DrizzleClient } from "@saneatsu/db";

/**
 * Googleアカウント情報からユーザーを作成または更新する
 *
 * @description
 * 1. メールアドレスでユーザーを検索
 * 2. 存在する場合は更新、存在しない場合は新規作成
 * 3. プロフィール情報（名前、アバター）を更新
 *
 * @param db - データベースクライアント
 * @param profile - Googleプロフィール情報
 * @returns 作成または更新されたユーザー
 */
export async function upsertUserFromGoogle(
	db: DrizzleClient,
	profile: {
		email: string;
		name: string;
		picture?: string;
		sub: string; // Google固有のユーザーID
	},
) {
	const existingUsers = await db
		.select()
		.from(users)
		.where(eq(users.email, profile.email))
		.limit(1);

	if (existingUsers.length > 0) {
		// 既存ユーザーの更新
		const [updatedUser] = await db
			.update(users)
			.set({
				name: profile.name,
				avatarUrl: profile.picture,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(users.id, existingUsers[0].id))
			.returning();

		return updatedUser;
	}

	// 新規ユーザーの作成
	const [newUser] = await db
		.insert(users)
		.values({
			email: profile.email,
			name: profile.name,
			avatarUrl: profile.picture,
			provider: "google",
			providerId: profile.sub,
		})
		.returning();

	return newUser;
}

/**
 * メールアドレスからユーザーを取得
 *
 * @param db - データベースクライアント
 * @param email - メールアドレス
 * @returns ユーザー情報またはnull
 */
export async function getUserByEmail(db: DrizzleClient, email: string) {
	const results = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	return results.length > 0 ? results[0] : null;
}