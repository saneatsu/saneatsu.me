import { z } from "zod";
import { dateTimeSchema, emailSchema, idSchema } from "./common";

/**
 * ユーザー関連のスキーマ定義
 */

/** パスワード強度のバリデーション */
export const passwordSchema = z
	.string()
	.min(8, "パスワードは8文字以上で入力してください")
	.max(100, "パスワードは100文字以内で入力してください")
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
		"パスワードは英小文字、英大文字、数字をそれぞれ1文字以上含む必要があります"
	);

/** ローカル認証用ユーザー作成スキーマ */
export const createLocalUserSchema = z.object({
	email: emailSchema,
	name: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください"),
	password: passwordSchema,
	provider: z.literal("local").default("local"),
});

/** OAuth認証用ユーザー作成スキーマ */
export const createOAuthUserSchema = z.object({
	email: emailSchema,
	name: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください"),
	avatarUrl: z.string().url("正しいURL形式で入力してください").optional(),
	provider: z.enum(["google"], {
		error: () => "サポートされていないプロバイダーです",
	}),
	providerId: z.string().min(1, "プロバイダーIDを入力してください"),
});

/** ユーザー作成時の入力スキーマ（統合） */
export const createUserSchema = z.discriminatedUnion("provider", [
	createLocalUserSchema,
	createOAuthUserSchema,
]);

/** ユーザー更新時の入力スキーマ */
export const updateUserSchema = z.object({
	name: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください")
		.optional(),
	avatarUrl: z.string().url("正しいURL形式で入力してください").optional(),
});

/** パスワード変更スキーマ */
export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
	newPassword: passwordSchema,
});

/** ローカル認証ログインスキーマ */
export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "パスワードを入力してください"),
});

/** ユーザーレスポンススキーマ（DB から取得） */
export const userSchema = z.object({
	id: idSchema,
	email: emailSchema,
	name: z.string(),
	avatarUrl: z.string().nullable(),
	passwordHash: z.string().nullable(),
	provider: z.enum(["local", "google"]),
	providerId: z.string().nullable(),
	createdAt: dateTimeSchema,
	updatedAt: dateTimeSchema,
});

/** 公開用ユーザー情報（センシティブ情報を除外） */
export const publicUserSchema = userSchema.pick({
	id: true,
	name: true,
	avatarUrl: true,
});

/** Google認証レスポンス */
export const googleAuthResponseSchema = z.object({
	id: z.string(),
	email: emailSchema,
	name: z.string(),
	picture: z.string().url().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateLocalUserInput = z.infer<typeof createLocalUserSchema>;
export type CreateOAuthUserInput = z.infer<typeof createOAuthUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type GoogleAuthResponse = z.infer<typeof googleAuthResponseSchema>;
