import { defaultLocale, locales } from "@saneatsu/i18n";
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
	locales,
	defaultLocale,
	localePrefix: "as-needed",
});

export const config = {
	// Match only internationalized pathnames
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};