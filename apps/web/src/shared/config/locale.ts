import type { useTranslations } from "next-intl";
import type { Locale } from "./locale-constants";

export const locales: Locale[] = ["ja", "en"];

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
