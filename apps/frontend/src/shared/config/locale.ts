import type { Locale } from "@saneatsu/i18n";
import type { useTranslations } from "next-intl";

type LocaleItem = {
	flag: string;
	value: Locale;
	label: string;
};

export const localeItems = (
	t: ReturnType<typeof useTranslations>
): LocaleItem[] => [
	{
		flag: "🇯🇵",
		value: "ja",
		label: t("ja"),
	},
	{
		flag: "🇺🇸",
		value: "en",
		label: t("en"),
	},
];
