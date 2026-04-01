"use client";

import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

import { useChatPanelPortal } from "@/shared/ui";

import { useResizePanel } from "../../shared/lib/use-resize-panel/use-resize-panel";

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

/** チャットパネルのデフォルト幅（px） */
const DEFAULT_CHAT_WIDTH = 380;

/**
 * ロケールレイアウトのシェルコンポーネント
 *
 * @description
 * ページ全体（Header + Main + Footer）とチャットパネルをFlexコンテナで横並びカラムとして配置する。
 * チャットパネルが開いているとき、コンテンツ列（flex-1）が自然に縮むため、
 * 個別のmarginRight調整やCSS変数ハックが不要になる。
 *
 * 1. チャットパネルの左端にリサイズハンドルを配置
 * 2. ドラッグ操作でパネル幅を280px〜600pxの範囲で変更可能
 * 3. requestAnimationFrameベースで60fpsのスムーズなリサイズを実現
 */
export function LayoutShell({
	header,
	footer,
	mobileMenu,
	children,
}: LayoutShellProps) {
	const { chatNode, isChatOpen } = useChatPanelPortal();
	const { width, cursorStyle, startResize } = useResizePanel({
		defaultWidth: DEFAULT_CHAT_WIDTH,
	});

	return (
		<div className="relative flex min-h-screen">
			{/* コンテンツ列: ヘッダー・メイン・フッターを含む */}
			<div className="flex min-w-0 flex-1 flex-col">
				{header}
				<main className="flex-1">{children}</main>
				{footer}
				{mobileMenu}
			</div>

			{/* チャット列: リサイズ可能なFlexカラムとして表示 */}
			{isChatOpen && chatNode && (
				<div className="relative shrink-0" style={{ width: `${width}px` }}>
					{/* リサイズハンドル: separator roleでアクセシビリティを確保 */}
					{/* biome-ignore lint/a11y/useSemanticElements: リサイズハンドルにhr要素は不適切 */}
					<div
						role="separator"
						tabIndex={0}
						aria-orientation="vertical"
						aria-valuenow={width}
						aria-valuemin={280}
						aria-valuemax={600}
						className={`absolute left-0 top-0 -ml-[1.8px] h-full w-1 ${cursorStyle} group z-10 flex items-center justify-center transition-colors hover:bg-primary/20`}
						onMouseDown={startResize}
					>
						<div className="flex h-10 w-3 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-muted/80">
							<GripVertical className="h-4 w-2 text-muted-foreground" />
						</div>
					</div>
					<div className="sticky top-0 h-dvh border-l">{chatNode}</div>
				</div>
			)}
		</div>
	);
}
