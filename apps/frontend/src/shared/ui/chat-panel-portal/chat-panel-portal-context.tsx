"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

interface ChatPanelPortalContextValue {
	/** チャットパネルとして表示するReactノード（nullの場合は非表示） */
	chatNode: ReactNode | null;
	/** チャットパネルのReactノードを設定する */
	setChatNode: (node: ReactNode | null) => void;
	/** チャットパネルが表示中かどうか */
	isChatOpen: boolean;
	/** チャットパネルをウィンドウ幅に拡大する。LayoutShellから注入される */
	onExpandChat: () => void;
	/** チャットパネルをデフォルト幅に戻す。LayoutShellから注入される */
	onCollapseChat: () => void;
	/** チャットパネルが拡大中かどうか */
	isChatExpanded: boolean;
}

const ChatPanelPortalContext =
	createContext<ChatPanelPortalContextValue | null>(null);

/**
 * チャットポータルコンテキストを取得するフック
 *
 * @description
 * ArticleDetailViewからレイアウト層にチャットパネルのReactNodeを渡すために使用する。
 * ChatPanelPortalProvider内でのみ使用可能。
 */
export function useChatPanelPortal() {
	const context = useContext(ChatPanelPortalContext);
	if (!context) {
		throw new Error(
			"useChatPanelPortal must be used within ChatPanelPortalProvider"
		);
	}
	return context;
}

/**
 * チャットポータルのプロバイダー
 *
 * @description
 * チャットパネルのReactNodeを下位コンポーネントから上位レイアウトへ渡すためのコンテキスト。
 * createPortalではなくコンテキスト+状態リフトアップを使用する理由は、
 * サーバーコンポーネントのレイアウトとの連携がシンプルになるため。
 */
interface ChatPanelPortalProviderProps {
	children: ReactNode;
	/** チャットパネルをウィンドウ幅に拡大するコールバック */
	onExpandChat?: () => void;
	/** チャットパネルをデフォルト幅に戻すコールバック */
	onCollapseChat?: () => void;
	/** チャットパネルが拡大中かどうか */
	isChatExpanded?: boolean;
}

export function ChatPanelPortalProvider({
	children,
	onExpandChat,
	onCollapseChat,
	isChatExpanded = false,
}: ChatPanelPortalProviderProps) {
	const [chatNode, setChatNode] = useState<ReactNode | null>(null);
	const noop = () => {};

	return (
		<ChatPanelPortalContext.Provider
			value={{
				chatNode,
				setChatNode,
				isChatOpen: chatNode !== null,
				onExpandChat: onExpandChat ?? noop,
				onCollapseChat: onCollapseChat ?? noop,
				isChatExpanded,
			}}
		>
			{children}
		</ChatPanelPortalContext.Provider>
	);
}
