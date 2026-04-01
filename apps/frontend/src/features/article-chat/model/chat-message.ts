/** チャットのメッセージ送信者ロール */
export type ChatRole = "user" | "assistant";

/** チャットメッセージの型定義 */
export interface ChatMessage {
	/** メッセージの一意ID */
	id: string;
	/** 送信者ロール */
	role: ChatRole;
	/** メッセージ内容（ストリーミング中は逐次更新される） */
	content: string;
	/** ストリーミング受信中かどうか */
	isStreaming?: boolean;
}
