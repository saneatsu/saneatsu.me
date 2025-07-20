import { z } from "zod";
import { dateTimeSchema, emailSchema, idSchema } from "./common";

/**
 * ユーザー関連のスキーマ定義
 */

/** ユーザー作成時の入力スキーマ */
export const createUserSchema = z.object({
	email: emailSchema,
	name: z
		.string()
		.min(1, "名前を入力してください")
		.max(100, "名前は100文字以内で入力してください"),
	avatarUrl: z.string().url("正しいURL形式で入力してください").optional(),
	provider: z
		.literal("google", {
			errorMap: () => ({
				message: "現在はGoogleプロバイダーのみサポートしています",
			}),
		})
		.default("google"),
	providerId: z.string().min(1, "プロバイダーIDを入力してください"),
});

/** ユーザー更新時の入力スキーマ */
export const updateUserSchema = createUserSchema.partial().omit({
	provider: true,
	providerId: true,
});

/** ユーザーレスポンススキーマ（DB から取得） */
export const userSchema = z.object({
	id: idSchema,
	email: emailSchema,
	name: z.string(),
	avatarUrl: z.string().nullable(),
	provider: z.string(),
	providerId: z.string(),
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
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type User = z.infer<typeof userSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type GoogleAuthResponse = z.infer<typeof googleAuthResponseSchema>;
