import { locales, type Locale } from "@saneatsu/i18n";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
	// Validate that the incoming `locale` parameter is valid
	if (!locales.includes(locale as Locale)) {
		notFound();
	}

	return {
		messages: (await import(`@saneatsu/i18n/src/locales/${locale}.json`))
			.default,
	};
});
