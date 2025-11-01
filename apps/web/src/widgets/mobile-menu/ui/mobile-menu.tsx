"use client";

import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { cn, Link, usePathname } from "@/shared/lib";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@/shared/ui";

/**
 * モバイル専用のフローティングメニューコンポーネント
 *
 * 実装内容：
 * 1. 画面右下に固定されたフローティングアクションボタン（FAB）を表示
 * 2. クリックで右下にポップオーバーを表示
 * 3. メニューの開閉状態に応じてアイコンをアニメーション変化（Menu ⇄ X）
 * 4. BlogとAboutへのナビゲーションリンクを提供
 */
export function MobileMenu() {
	const t = useTranslations("navigation");
	const locale = useLocale();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

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

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="default"
					size="icon"
					className="fixed bottom-4 right-4 z-50 md:hidden rounded-full shadow-lg w-14 h-14"
					aria-label="Toggle navigation menu"
				>
					{isOpen ? (
						<X className="h-6 w-6 transition-transform duration-200" />
					) : (
						<Menu className="h-6 w-6 transition-transform duration-200" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				align="end"
				className="w-48 p-4"
				sideOffset={8}
			>
				<nav className="flex flex-col space-y-4">
					<Link
						href="/"
						className={cn(
							"text-base transition-colors hover:text-foreground/80",
							isActivePath("/")
								? "text-foreground font-semibold"
								: "text-foreground/70"
						)}
						onClick={() => setIsOpen(false)}
					>
						{t("top")}
					</Link>
					<Link
						href="/blog"
						className={cn(
							"text-base transition-colors hover:text-foreground/80",
							isActivePath("/blog")
								? "text-foreground font-semibold"
								: "text-foreground/70"
						)}
						onClick={() => setIsOpen(false)}
					>
						Blog
					</Link>
					<Link
						href="/about"
						className={cn(
							"text-base transition-colors hover:text-foreground/80",
							isActivePath("/about")
								? "text-foreground font-semibold"
								: "text-foreground/70"
						)}
						onClick={() => setIsOpen(false)}
					>
						{t("about")}
					</Link>
				</nav>
			</PopoverContent>
		</Popover>
	);
}
