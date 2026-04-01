"use client";

import { Rss } from "lucide-react";
import { siGithub, siX } from "simple-icons";

import { LanguageSwitcher } from "@/features/lang";
import { navigationItems } from "@/shared/config";
import { cn, isActivePath, Link, usePathname } from "@/shared/lib";
import { ThemeSelector } from "@/shared/ui";

export function Header() {
	const pathname = usePathname();

	/**
	 * ナビゲーションリンクのスタイルを生成する
	 */
	const getNavLinkClassName = (path: string) => {
		return cn(
			"transition-colors hover:text-foreground/80",
			isActivePath(pathname, path)
				? "text-primary font-medium"
				: "text-foreground/60"
		);
	};

	return (
		<header
			className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-[margin] duration-300"
			style={{ marginRight: "var(--chat-panel-offset, 0px)" }}
		>
			<div className="container mx-auto px-4">
				<div className="max-w-7xl mx-auto flex h-14 items-center">
					<div className="mr-4 flex">
						<Link
							href="/"
							className={cn(
								"mr-6 flex items-center space-x-2 transition-colors hover:text-foreground/80",
								isActivePath(pathname, "/")
									? "text-primary"
									: "text-foreground/90"
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
					<div className="flex flex-1 items-center justify-end gap-2">
						<Link
							href="/rss.xml"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:text-foreground/80"
							aria-label="RSS"
						>
							<Rss className="h-5 w-5" strokeWidth={1.8} />
						</Link>
						<Link
							href="https://github.com/saneatsu/saneatsu.me"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:text-foreground/80"
							aria-label="GitHub"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="h-5 w-5"
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
							className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:text-foreground/80"
							aria-label="X"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="h-4 w-4"
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
