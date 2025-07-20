"use client";

import { Menu, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../language-switcher";
import { useTheme } from "../theme-provider";

export function Header() {
	const { setTheme, theme } = useTheme();
	const t = useTranslations("navigation");

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<div className="mr-4 flex">
					<Link href="/" className="mr-6 flex items-center space-x-2">
						<span className="font-bold">Saneatsu Blog</span>
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
					<LanguageSwitcher />
					<button
						className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
						type="button"
						aria-label="Toggle theme"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					>
						<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
						<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					</button>
					<button
						className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 md:hidden"
						type="button"
						aria-label="Toggle menu"
					>
						<Menu className="h-4 w-4" />
					</button>
				</div>
			</div>
		</header>
	);
}
