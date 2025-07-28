"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "../../../features/lang";
import { Button } from "../../../shared/ui/button/button";
import { cn } from "../../../shared/lib/utils";
import { ThemeSelector } from "../../../shared/ui/theme-selector/theme-selector";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../../shared/ui/tooltip/tooltip";

export function Header() {
	const t = useTranslations("navigation");
	const locale = useLocale();
	const pathname = usePathname();

	/**
	 * 指定されたパスがアクティブかどうかを判定する
	 */
	const isActivePath = (path: string) => {
		if (path === `/${locale}`) {
			// ホームページの場合は完全一致
			return pathname === `/${locale}`;
		}
		// その他のページは前方一致（サブページも含む）
		return pathname.startsWith(path);
	};

	/**
	 * ナビゲーションリンクのスタイルを生成する
	 */
	const getNavLinkClassName = (path: string) => {
		return cn(
			"transition-colors hover:text-foreground/80",
			isActivePath(path)
				? "text-foreground font-medium"
				: "text-foreground/60"
		);
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<div className="mr-4 flex">
					<Link
						href={`/${locale}`}
						className={cn(
							"mr-6 flex items-center space-x-2 transition-colors hover:text-foreground/80",
							isActivePath(`/${locale}`)
								? "text-foreground"
								: "text-foreground/90"
						)}
					>
						<span className="font-bold">saneatsu.me</span>
					</Link>
					<nav className="flex items-center space-x-6 text-sm font-medium">
						<Link
							href={`/${locale}/articles`}
							className={getNavLinkClassName(`/${locale}/articles`)}
						>
							{t("blog")}
						</Link>
						<Link
							href={`/${locale}/tags`}
							className={getNavLinkClassName(`/${locale}/tags`)}
						>
							{t("tags")}
						</Link>
						<Link
							href={`/${locale}/about`}
							className={getNavLinkClassName(`/${locale}/about`)}
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
