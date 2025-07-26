import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "../lib/locale";

/**
 * Get the request configuration for internationalization.
 *
 * This function provides a static locale, fetches a user setting,
 * or reads from `cookies()`, `headers()`, etc.
 *
 * @returns {Promise<{locale: string, messages: object}>} The locale and messages.
 */
export default getRequestConfig(async () => {
	const locale = await getUserLocale();

	// Load all message files for the locale
	const messages = (await import(`@saneatsu/i18n/src/locales/${locale}.json`)).default;

	return {
		locale,
		messages,
	};
});