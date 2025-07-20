/**
 * next-intl設定
 */

export const locales = ["ja", "en"] as const;
export const defaultLocale = "ja" as const;

export type Locale = (typeof locales)[number];

/**
 * ロケール設定
 */
export const i18nConfig = {
	locales,
	defaultLocale,
	localePrefix: "as-needed",
} as const;
