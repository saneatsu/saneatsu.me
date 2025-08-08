import { z } from "@hono/zod-openapi";

/**
 * ユーザー作成/更新リクエストのスキーマ
 */
export const UpsertUserSchema = z.object({
	email: z.string().email().openapi({
		example: "user@example.com",
		description: "ユーザーのメールアドレス",
	}),
	name: z.string().min(1).openapi({
		example: "John Doe",
		description: "ユーザーの表示名",
	}),
	picture: z.string().url().optional().openapi({
		example: "https://example.com/avatar.jpg",
		description: "ユーザーのアバター画像URL",
	}),
	sub: z.string().min(1).openapi({
		example: "123456789",
		description: "Google固有のユーザーID",
	}),
});

/**
 * ユーザー情報レスポンスのスキーマ
 */
export const UserResponseSchema = z.object({
	id: z.number().openapi({
		example: 1,
		description: "ユーザーID",
	}),
	email: z.string().email().openapi({
		example: "user@example.com",
		description: "メールアドレス",
	}),
	name: z.string().openapi({
		example: "John Doe",
		description: "表示名",
	}),
	avatarUrl: z.string().nullable().openapi({
		example: "https://example.com/avatar.jpg",
		description: "アバター画像URL",
	}),
	provider: z.string().openapi({
		example: "google",
		description: "認証プロバイダー",
	}),
	providerId: z.string().openapi({
		example: "123456789",
		description: "プロバイダー固有のID",
	}),
	isAdmin: z.boolean().openapi({
		example: true,
		description: "管理者権限の有無",
	}),
	createdAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "作成日時",
	}),
	updatedAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "更新日時",
	}),
});

/**
 * 認証エラーレスポンスのスキーマ
 */
export const AuthErrorSchema = z.object({
	error: z.object({
		code: z.enum(["UNAUTHORIZED", "FORBIDDEN", "USER_NOT_FOUND"]).openapi({
			example: "UNAUTHORIZED",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "認証されていません",
			description: "エラーメッセージ",
		}),
	}),
});
