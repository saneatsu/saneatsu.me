"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

interface ChatPanelPortalContextValue {
	/** チャットパネルとして表示するReactノード（nullの場合は非表示） */
	chatNode: ReactNode | null;
	/** チャットパネルのReactノードを設定する */
	setChatNode: (node: ReactNode | null) => void;
	/** チャットパネルが表示中かどうか */
	isChatOpen: boolean;
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
export function ChatPanelPortalProvider({ children }: { children: ReactNode }) {
	const [chatNode, setChatNode] = useState<ReactNode | null>(null);

	return (
		<ChatPanelPortalContext.Provider
			value={{
				chatNode,
				setChatNode,
				isChatOpen: chatNode !== null,
			}}
		>
			{children}
		</ChatPanelPortalContext.Provider>
	);
}
