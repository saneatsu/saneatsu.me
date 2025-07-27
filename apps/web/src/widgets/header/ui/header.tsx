"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "../../../features/lang";
import { Button } from "../../../shared/ui/button/button";
import { ThemeSelector } from "../../../shared/ui/theme-selector/theme-selector";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../../shared/ui/tooltip/tooltip";

export function Header() {
	const t = useTranslations("navigation");
	const locale = useLocale();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<div className="mr-4 flex">
					<Link href={`/${locale}`} className="mr-6 flex items-center space-x-2">
						<span className="font-bold">saneatsu.me</span>
					</Link>
					<nav className="flex items-center space-x-6 text-sm font-medium">
						<Link
							href={`/${locale}/articles`}
							className="transition-colors hover:text-foreground/80 text-foreground/60"
						>
							{t("blog")}
						</Link>
						<Link
							href={`/${locale}/tags`}
							className="transition-colors hover:text-foreground/80 text-foreground/60"
						>
							{t("tags")}
						</Link>
						<Link
							href={`/${locale}/about`}
							className="transition-colors hover:text-foreground/80 text-foreground/60"
						>
							{t("about")}
						</Link>
					</nav>
				</div>
				<div className="flex flex-1 items-center justify-end space-x-2">
					<LanguageSwitcher />
					<ThemeSelector />
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden"
								aria-label="Toggle menu"
							>
								<Menu className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>メニューを開く</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</header>
	);
}
