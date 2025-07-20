import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { locales } from "@saneatsu/i18n";

export default getRequestConfig(async ({ locale }) => {
	// Validate that the incoming `locale` parameter is valid
	if (!locales.includes(locale as any)) {
		notFound();
	}

	return {
		messages: (await import(`@saneatsu/i18n/src/locales/${locale}.json`)).default,
	};
});