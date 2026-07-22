/**
 * next-intl設定
 */

export const locales = ["ja", "en"] as const;
// ブラウザの言語が未対応・不明な場合のフォールバック先。
// 日本語以外のユーザーにも読めるよう、既定は英語（en）とする。
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

/**
 * ロケール設定
 */
export const i18nConfig = {
	locales,
	defaultLocale,
	localePrefix: "as-needed",
} as const;
