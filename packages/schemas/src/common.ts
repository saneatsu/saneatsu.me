import { z } from "zod";

/**
 * 共通のバリデーション定義
 */

/** 言語コード */
export const languageSchema = z.enum(["ja", "en"], {
	errorMap: () => ({ message: "言語は日本語または英語を選択してください" }),
});

/** 記事ステータス */
export const articleStatusSchema = z.enum(["published", "draft", "archived"], {
	errorMap: () => ({ message: "無効なステータスです" }),
});

/** スラッグ（URL用文字列） */
export const slugSchema = z
	.string()
	.min(1, "スラッグを入力してください")
	.max(100, "スラッグは100文字以内で入力してください")
	.regex(/^[a-z0-9-]+$/, "スラッグは小文字の英数字とハイフンのみ使用できます");

/** メールアドレス */
export const emailSchema = z
	.string()
	.email("正しいメールアドレスを入力してください");

/** 日時文字列（ISO 8601形式） */
export const dateTimeSchema = z.string().datetime({
	message: "正しい日時形式で入力してください",
});

/** ID（正の整数） */
export const idSchema = z
	.number()
	.int()
	.positive("IDは正の整数である必要があります");

/** オプショナルなCloudflare Images ID */
export const cloudflareImageIdSchema = z.string().optional();

export type Language = z.infer<typeof languageSchema>;
export type ArticleStatus = z.infer<typeof articleStatusSchema>;
export type Slug = z.infer<typeof slugSchema>;
export type Email = z.infer<typeof emailSchema>;
export type DateTime = z.infer<typeof dateTimeSchema>;
export type Id = z.infer<typeof idSchema>;
export type CloudflareImageId = z.infer<typeof cloudflareImageIdSchema>;
