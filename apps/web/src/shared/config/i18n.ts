import { type Locale, locales } from "@saneatsu/i18n";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
	// Obtain the locale from the request
	const locale = await requestLocale;

	// Validate that the incoming `locale` parameter is valid
	if (!locale || !locales.includes(locale as Locale)) {
		notFound();
	}

	return {
		locale,
		messages: (await import(`@saneatsu/i18n/src/locales/${locale}.json`))
			.default,
	};
});
