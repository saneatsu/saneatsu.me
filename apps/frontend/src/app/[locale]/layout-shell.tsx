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
 * 2. xl未満: Flexカラム（コンテンツ flex-1 + チャット w-[320px]）
 *
 * すべての画面幅でstaticなFlexカラムとして表示することで、
 * チャット開閉時にTOCが常に表示される状態を保証する。
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

			{/* チャット列: すべての画面幅でstaticなFlexカラムとして表示 */}
			{isChatOpen && chatNode && (
				<div className="w-[320px] shrink-0 xl:w-[400px]">
					<div className="sticky top-0 h-dvh border-l">{chatNode}</div>
				</div>
			)}
		</div>
	);
}
