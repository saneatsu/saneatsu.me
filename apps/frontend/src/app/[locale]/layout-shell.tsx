"use client";

import type { ReactNode } from "react";

import { useChatPanelPortal } from "@/shared/ui";

interface LayoutShellProps {
	/** ヘッダーコンポーネント */
	header: ReactNode;
	/** フッターコンポーネント */
	footer: ReactNode;
	/** モバイルメニューコンポーネント */
	mobileMenu: ReactNode;
	/** ページコンテンツ */
	children: ReactNode;
}

/**
 * ロケールレイアウトのシェルコンポーネント
 *
 * @description
 * ページ全体（Header + Main + Footer）とチャットパネルをFlexコンテナで横並びカラムとして配置する。
 * チャットパネルが開いているとき、コンテンツ列（flex-1）が自然に縮むため、
 * 個別のmarginRight調整やCSS変数ハックが不要になる。
 *
 * 1. xl(1280px)以上: Flexカラム（コンテンツ flex-1 + チャット w-[400px]）
 * 2. xl未満: チャットをfixedフルスクリーンオーバーレイとして表示
 */
export function LayoutShell({
	header,
	footer,
	mobileMenu,
	children,
}: LayoutShellProps) {
	const { chatNode, isChatOpen } = useChatPanelPortal();

	return (
		<div className="relative flex min-h-screen">
			{/* コンテンツ列: ヘッダー・メイン・フッターを含む */}
			<div className="flex min-w-0 flex-1 flex-col">
				{header}
				<main className="flex-1">{children}</main>
				{footer}
				{mobileMenu}
			</div>

			{/* チャット列: xl以上はフロー内カラム、xl未満はfixedオーバーレイ */}
			{isChatOpen && chatNode && (
				<div className="fixed inset-0 z-50 bg-background xl:static xl:inset-auto xl:z-auto xl:w-[400px] xl:shrink-0">
					<div className="h-dvh xl:sticky xl:top-0 xl:border-l">{chatNode}</div>
				</div>
			)}
		</div>
	);
}
