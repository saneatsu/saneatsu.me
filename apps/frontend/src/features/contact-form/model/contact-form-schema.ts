import { z } from "zod";

/** お問い合わせフォームのカテゴリ値 */
export const CONTACT_CATEGORIES = [
	"general",
	"business",
	"feedback",
	"bug-report",
	"other",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

/**
 * お問い合わせフォームのバリデーションスキーマ
 *
 * 1. name - 名前（必須、1〜100文字）
 * 2. email - メールアドレス（必須、メール形式）
 * 3. subject - 件名（必須、1〜200文字）
 * 4. category - カテゴリ（必須、セレクト）
 * 5. message - メッセージ本文（必須、1〜5000文字）
 * 6. honeypot - スパム防止用ハニーポット（空であること）
 */
export const contactFormSchema = z.object({
	name: z
		.string()
		.min(1, { message: "お名前を入力してください" })
		.max(100, { message: "お名前は100文字以内で入力してください" }),
	email: z
		.string()
		.min(1, { message: "メールアドレスを入力してください" })
		.email({ message: "正しいメールアドレスの形式で入力してください" }),
	subject: z
		.string()
		.min(1, { message: "件名を入力してください" })
		.max(200, { message: "件名は200文字以内で入力してください" }),
	category: z.enum(CONTACT_CATEGORIES, {
		message: "カテゴリを選択してください",
	}),
	message: z
		.string()
		.min(1, { message: "メッセージを入力してください" })
		.max(5000, { message: "メッセージは5000文字以内で入力してください" }),
	honeypot: z.string().max(0).optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
