/**
 * next-intl設定
 */

export const locales = ["ja", "en", "es"] as const;
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

/**
 * ロケール → BCP 47 言語タグ（`Intl` / `toLocaleDateString` 用）の対応表
 *
 * @description
 * `new Date().toLocaleDateString(locale)` などに渡すロケール文字列を、
 * サイトのロケールコードから一元的に解決するためのマップ。
 * 言語を追加したらここに1行足すだけでよい（三項演算子の分岐漏れを防ぐ）。
 */
export const bcp47ByLocale: Record<Locale, string> = {
	ja: "ja-JP",
	en: "en-US",
	es: "es-ES",
};

/**
 * ロケール → Open Graph の `og:locale` 値の対応表
 *
 * @description
 * Open Graph は `ja_JP` のようにアンダースコア区切りの表記を用いるため、
 * BCP 47（ハイフン区切り）とは別に定義する。
 */
export const openGraphLocaleByLocale: Record<Locale, string> = {
	ja: "ja_JP",
	en: "en_US",
	es: "es_ES",
};
