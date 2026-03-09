import { createRoute, z } from "@hono/zod-openapi";

/**
 * お問い合わせカテゴリの定義
 */
const CONTACT_CATEGORIES = [
	"business",
	"feedback",
	"bug-report",
	"other",
] as const;

/**
 * お問い合わせフォーム送信のリクエストボディスキーマ
 */
const ContactRequestSchema = z.object({
	name: z
		.string()
		.min(1)
		.max(100)
		.openapi({ example: "山田太郎", description: "お名前" }),
	company: z
		.string()
		.min(1)
		.max(100)
		.openapi({ example: "株式会社サンプル", description: "会社名" }),
	jobTitle: z
		.string()
		.max(100)
		.optional()
		.openapi({ example: "エンジニア", description: "役職（任意）" }),
	email: z
		.string()
		.email()
		.openapi({ example: "yamada@example.com", description: "メールアドレス" }),
	subject: z
		.string()
		.min(1)
		.max(200)
		.openapi({ example: "お仕事のご依頼", description: "件名" }),
	category: z.enum(CONTACT_CATEGORIES).openapi({
		example: "business",
		description: "お問い合わせカテゴリ",
	}),
	message: z.string().min(1).max(5000).openapi({
		example: "お問い合わせ内容です。",
		description: "メッセージ本文",
	}),
});

/**
 * 成功レスポンススキーマ
 */
const SuccessResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
});

/**
 * エラーレスポンススキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "SUBMISSION_FAILED",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example:
				"お問い合わせの送信に失敗しました。時間をおいて再度お試しください。",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * お問い合わせフォーム送信のルート定義
 */
export const submitContactRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: ContactRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
			description: "お問い合わせの送信成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "バリデーションエラー",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Google Formsへの送信失敗",
		},
	},
	tags: ["Contact"],
	summary: "お問い合わせフォーム送信",
	description: "お問い合わせ内容をサーバーサイドでGoogle Formsに送信します。",
});
