"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { navigationItems } from "@/shared/config";
import { cn, isActivePath, Link, usePathname } from "@/shared/lib";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@/shared/ui";

/**
 * モバイル専用のフローティングメニューコンポーネント
 *
 * 実装内容：
 * 1. 画面右下に固定されたフローティングアクションボタン（FAB）を表示
 * 2. クリックで右下にポップオーバーを表示
 * 3. メニューの開閉状態に応じてアイコンをアニメーション変化（Menu ⇄ X）
 * 4. 全ナビゲーションアイテム（Home, Blog, About, Gallery）へのリンクを提供
 */
export function MobileMenu() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

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
					{navigationItems.map((item) => (
						<Link
							key={item.path}
							href={item.path}
							className={cn(
								"text-base transition-colors hover:text-foreground/80",
								isActivePath(pathname, item.path)
									? "text-primary font-semibold"
									: "text-foreground/70"
							)}
							onClick={() => setIsOpen(false)}
						>
							{item.label}
						</Link>
					))}
				</nav>
			</PopoverContent>
		</Popover>
	);
}
