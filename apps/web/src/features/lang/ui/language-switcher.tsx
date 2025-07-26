"use client";

import { Check, Globe } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "../../../shared/ui/button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../../shared/ui/dropdown-menu/dropdown-menu";

const languages = [
	{ code: "ja", label: "日本語", flag: "🇯🇵" },
	{ code: "en", label: "English", flag: "🇺🇸" },
] as const;

export function LanguageSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const switchLanguage = (newLocale: string) => {
		// Remove current locale from pathname and add new locale
		const pathWithoutLocale = pathname.replace(`/${locale}`, "");
		const newPathname = `/${newLocale}${pathWithoutLocale}`;

		router.push(newPathname);
	};

	const currentLanguage = languages.find((lang) => lang.code === locale);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="言語を切り替え"
				>
					<Globe className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{languages.map((language) => (
					<DropdownMenuItem
						key={language.code}
						onClick={() => switchLanguage(language.code)}
						className="flex items-center gap-2"
					>
						<span>{language.flag}</span>
						<span>{language.label}</span>
						{locale === language.code && (
							<Check className="ml-auto h-4 w-4" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
