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
 * 2. company - 会社名（必須、1〜100文字）
 * 3. jobTitle - 役職（オプション、最大100文字）
 * 4. email - メールアドレス（必須、メール形式）
 * 5. subject - 件名（必須、1〜200文字）
 * 6. category - カテゴリ（必須、セレクト）
 * 7. message - メッセージ本文（必須、1〜5000文字）
 * 8. honeypot - スパム防止用ハニーポット（空であること）
 */
export const contactFormSchema = z.object({
	name: z
		.string()
		.min(1, { message: "お名前を入力してください" })
		.max(100, { message: "お名前は100文字以内で入力してください" }),
	company: z
		.string()
		.min(1, { message: "会社名を入力してください" })
		.max(100, { message: "会社名は100文字以内で入力してください" }),
	jobTitle: z
		.string()
		.max(100, { message: "役職は100文字以内で入力してください" })
		.optional()
		.or(z.literal("")),
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
