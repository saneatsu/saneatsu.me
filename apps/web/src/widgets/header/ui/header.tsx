"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "../../../shared/ui/button/button";
import { LocaleSwitcher } from "../../../shared/ui/locale-switcher/locale-switcher";
import { ThemeSelector } from "../../../shared/ui/theme-selector/theme-selector";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../../shared/ui/tooltip/tooltip";

export function Header() {
	const t = useTranslations("navigation");

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<div className="mr-4 flex">
					<Link href="/" className="mr-6 flex items-center space-x-2">
						<span className="font-bold">saneatsu.me</span>
					</Link>
					<nav className="flex items-center space-x-6 text-sm font-medium">
						<Link
							href="/blog"
							className="transition-colors hover:text-foreground/80 text-foreground/60"
						>
							{t("blog")}
						</Link>
						<Link
							href="/tags"
							className="transition-colors hover:text-foreground/80 text-foreground/60"
						>
							{t("tags")}
						</Link>
						<Link
							href="/about"
							className="transition-colors hover:text-foreground/80 text-foreground/60"
						>
							{t("about")}
						</Link>
					</nav>
				</div>
				<div className="flex flex-1 items-center justify-end space-x-2">
					<LocaleSwitcher />
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
