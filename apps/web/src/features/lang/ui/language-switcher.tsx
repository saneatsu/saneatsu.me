"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "../../../shared/ui/button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
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

	// 現在の言語のフラグを取得
	const currentFlag = () => {
		const currentLanguage = languages.find((lang) => lang.code === locale);
		return currentLanguage?.flag || "🌐";
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="言語を切り替え">
					<span className="text-base">{currentFlag()}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-36">
				<DropdownMenuRadioGroup
					value={locale}
					onValueChange={(value) => {
						if (value) {
							switchLanguage(value);
						}
					}}
				>
					{languages.map((language) => (
						<DropdownMenuRadioItem
							key={language.code}
							value={language.code}
							className="cursor-pointer flex items-center"
						>
							<span className="mr-2">{language.flag}</span>
							{language.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
