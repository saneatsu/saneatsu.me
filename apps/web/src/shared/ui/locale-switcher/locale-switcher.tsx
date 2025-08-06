"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { localeItems as getLocaleItems } from "../../config/locale";
import type { Locale } from "../../config/locale-constants";
import { setUserLocale } from "../../lib/locale";
import { cn } from "../../lib/utils";
import { Button } from "../button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";

export function LocaleSwitcher() {
	const locale = useLocale();
	const t = useTranslations("LocaleSwitcher");

	const items = getLocaleItems(t);

	const [isPending, startTransition] = useTransition();

	function onChange(value: string) {
		const locale = value as Locale;
		startTransition(() => {
			setUserLocale(locale);
		});
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn(isPending && "pointer-events-none opacity-60")}
					aria-label={t("label")}
				>
					<Languages className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuRadioGroup
					defaultValue={locale}
					value={locale}
					onValueChange={onChange}
				>
					{items.map((item) => (
						<DropdownMenuRadioItem
							key={item.value}
							value={item.value}
							className="hover:cursor-pointer"
							aria-label={item.label}
						>
							{item.flag} {item.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
