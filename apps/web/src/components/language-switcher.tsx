"use client";

import { Globe } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const switchLanguage = () => {
		const newLocale = locale === "ja" ? "en" : "ja";

		// Remove current locale from pathname and add new locale
		const pathWithoutLocale = pathname.replace(`/${locale}`, "");
		const newPathname = `/${newLocale}${pathWithoutLocale}`;

		router.push(newPathname);
	};

	return (
		<button
			className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
			type="button"
			aria-label={locale === "ja" ? "Switch to English" : "日本語に切り替え"}
			onClick={switchLanguage}
		>
			<Globe className="h-4 w-4" />
			<span className="sr-only">
				{locale === "ja" ? "Switch to English" : "日本語に切り替え"}
			</span>
		</button>
	);
}
