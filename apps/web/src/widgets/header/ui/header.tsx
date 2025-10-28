"use client";

import { Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/features/lang";
import { cn, Link, usePathname } from "@/shared/lib";
import {
	Button,
	ThemeSelector,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui";

export function Header() {
	const t = useTranslations("navigation");
	const locale = useLocale();
	const pathname = usePathname();

	/**
	 * 指定されたパスがアクティブかどうかを判定する
	 *
	 * @param path - ロケールを含まない相対パス（例: "/", "/blog", "/about"）
	 */
	const isActivePath = (path: string) => {
		if (path === "/") {
			// ホームページの場合は完全一致（ロケールのみのパス）
			return pathname === `/${locale}`;
		}
		// その他のページは前方一致（サブページも含む）
		// path に locale を追加してチェック
		return pathname.startsWith(`/${locale}${path}`);
	};

	/**
	 * ナビゲーションリンクのスタイルを生成する
	 */
	const getNavLinkClassName = (path: string) => {
		return cn(
			"transition-colors hover:text-foreground/80",
			isActivePath(path) ? "text-foreground font-medium" : "text-foreground/60"
		);
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="max-w-7xl mx-auto flex h-14 items-center">
					<div className="mr-4 flex">
						<Link
							href="/"
							className={cn(
								"mr-6 flex items-center space-x-2 transition-colors hover:text-foreground/80",
								isActivePath("/") ? "text-foreground" : "text-foreground/90"
							)}
						>
							<span className="font-bold">saneatsu.me</span>
						</Link>
						<nav className="flex items-center space-x-6 text-sm font-medium">
							<Link href="/blog" className={getNavLinkClassName("/blog")}>
								Blog
							</Link>
							<Link href="/about" className={getNavLinkClassName("/about")}>
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
			</div>
		</header>
	);
}
