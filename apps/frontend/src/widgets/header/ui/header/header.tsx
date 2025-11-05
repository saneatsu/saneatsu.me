"use client";

import { useLocale } from "next-intl";
import { siGithub, siX } from "simple-icons";

import { LanguageSwitcher } from "@/features/lang";
import { navigationItems } from "@/shared/config";
import { cn, Link, usePathname } from "@/shared/lib";
import { ThemeSelector } from "@/shared/ui";

export function Header() {
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
						<nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
							{navigationItems
								.filter((item) => item.path !== "/")
								.map((item) => (
									<Link
										key={item.path}
										href={item.path}
										className={getNavLinkClassName(item.path)}
									>
										{item.label}
									</Link>
								))}
						</nav>
					</div>
					<div className="flex flex-1 items-center justify-end space-x-2">
						<Link
							href="https://github.com/saneatsu/saneatsu.me"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground transition-colors hover:text-foreground/80"
							aria-label="GitHub"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="h-5 w-5 mx-2"
								fill="currentColor"
							>
								<title>GitHub</title>
								<path d={siGithub.path} />
							</svg>
						</Link>
						<Link
							href="https://x.com/saneatsu_wakana"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground transition-colors hover:text-foreground/80"
							aria-label="X"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="h-4 w-4 mx-2"
								fill="currentColor"
							>
								<title>X</title>
								<path d={siX.path} />
							</svg>
						</Link>
						<LanguageSwitcher />
						<ThemeSelector />
					</div>
				</div>
			</div>
		</header>
	);
}
