import { z } from "zod";
import { i18nMessage } from "./i18n";

/**
 * 共通のバリデーション定義
 */

/** 言語コード */
export const languageSchema = z.enum(["ja", "en"], {
	error: () => i18nMessage("validation.custom.common.languageInvalid"),
});

/** 記事ステータス */
export const articleStatusSchema = z.enum(["published", "draft", "archived"], {
	error: () => i18nMessage("validation.custom.common.statusInvalid"),
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

/**
 * Cloudflare Images バリアント
 *
 * @description
 * すべてのバリアントは Cloudflare 側で設定されています。
 *
 * バリアント一覧:
 * - small (400x, contain): サムネイル、小さな画像プレビュー
 * - medium (800x, contain): 記事一覧のサムネイル
 * - original (800x, scale-down): 記事内画像の保存・表示用（アップロード時のデフォルト）
 * - large (1200x, contain): Lightbox拡大表示（中）
 * - xlarge (1600x, contain): Lightbox拡大表示（大）
 *
 * @see docs/cloudflare-images.md - 詳細な設定ガイド
 */
export const imageVariantSchema = z.enum([
	"small",
	"medium",
	"original",
	"large",
	"xlarge",
]);

export type Language = z.infer<typeof languageSchema>;
export type ArticleStatus = z.infer<typeof articleStatusSchema>;
export type Slug = z.infer<typeof slugSchema>;
export type Email = z.infer<typeof emailSchema>;
export type DateTime = z.infer<typeof dateTimeSchema>;
export type Id = z.infer<typeof idSchema>;
export type CloudflareImageId = z.infer<typeof cloudflareImageIdSchema>;
export type ImageVariant = z.infer<typeof imageVariantSchema>;
