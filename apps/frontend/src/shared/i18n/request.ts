import type { Locale } from "@saneatsu/i18n";
import { defaultLocale, locales } from "@saneatsu/i18n";
import { getRequestConfig } from "next-intl/server";

function isValidLocale(locale: string): locale is Locale {
	return locales.includes(locale as Locale);
}

/**
 * Get the request configuration for internationalization.
 *
 * This function extracts the locale from the URL path.
 * The locale is expected to be the first segment of the pathname.
 *
 * @returns {Promise<{locale: string, messages: object}>} The locale and messages.
 */
export default getRequestConfig(async ({ requestLocale }) => {
	// requestLocale is provided by Next.js when using the [locale] dynamic segment
	let locale = await requestLocale;

	// Validate that the incoming locale is valid
	if (!locale || !isValidLocale(locale)) {
		locale = defaultLocale;
	}

	// Load all message files for the locale
	const messages = (await import(`@saneatsu/i18n/src/locales/${locale}.json`))
		.default;

	return {
		locale,
		messages,
	};
});
