import { z } from "zod";
import { i18nMessage } from "./i18n";

/**
 * 共通のバリデーション定義
 */

/** 言語コード */
export const languageSchema = z.enum(["ja", "en"], {
	errorMap: () => i18nMessage("validation.custom.common.languageInvalid"),
});

/** 記事ステータス */
export const articleStatusSchema = z.enum(["published", "draft", "archived"], {
	errorMap: () => i18nMessage("validation.custom.common.statusInvalid"),
});

/** スラッグ（URL用文字列） */
export const slugSchema = z
	.string()
	.min(1, i18nMessage("validation.custom.common.slugRequired"))
	.max(100, i18nMessage("validation.custom.common.slugTooLong"))
	.regex(/^[a-z0-9-]+$/, i18nMessage("validation.custom.common.slugInvalid"));

/** メールアドレス */
export const emailSchema = z
	.string()
	.email(i18nMessage("validation.custom.common.emailInvalid"));

/** 日時文字列（ISO 8601形式） */
export const dateTimeSchema = z
	.string()
	.datetime(i18nMessage("validation.custom.common.datetimeInvalid"));

/** ID（正の整数） */
export const idSchema = z
	.number()
	.int()
	.positive(i18nMessage("validation.custom.common.idPositive"));

/** オプショナルなCloudflare Images ID */
export const cloudflareImageIdSchema = z.string().optional();

export type Language = z.infer<typeof languageSchema>;
export type ArticleStatus = z.infer<typeof articleStatusSchema>;
export type Slug = z.infer<typeof slugSchema>;
export type Email = z.infer<typeof emailSchema>;
export type DateTime = z.infer<typeof dateTimeSchema>;
export type Id = z.infer<typeof idSchema>;
export type CloudflareImageId = z.infer<typeof cloudflareImageIdSchema>;
