import { trackEvent } from "@/shared/lib/analytics";

/**
 * AIチャットパネルが開かれた時のイベントを送信する
 *
 * @param articleSlug - 閲覧中の記事slug
 */
export function trackArticleChatOpen(articleSlug?: string): void {
	trackEvent("ai_chat_open", {
		article_slug: articleSlug ?? "(none)",
	});
}

/**
 * ユーザーがメッセージを送信した時のイベントを送信する
 *
 * @description プライバシー配慮のため、メッセージ内容は送信せず文字数のみ記録する
 *
 * @param articleSlug - 閲覧中の記事slug
 * @param messageLength - 送信メッセージの文字数
 */
export function trackArticleChatMessageSent(
	articleSlug: string | undefined,
	messageLength: number
): void {
	trackEvent("ai_chat_message_sent", {
		article_slug: articleSlug ?? "(none)",
		message_length: messageLength,
	});
}

/**
 * AIレスポンスのストリーミングが完了した時のイベントを送信する
 *
 * @param articleSlug - 閲覧中の記事slug
 * @param responseLength - レスポンスの文字数
 */
export function trackArticleChatResponseComplete(
	articleSlug: string | undefined,
	responseLength: number
): void {
	trackEvent("ai_chat_response_complete", {
		article_slug: articleSlug ?? "(none)",
		response_length: responseLength,
	});
}

/**
 * AIチャットでエラーが発生した時のイベントを送信する
 *
 * @param articleSlug - 閲覧中の記事slug
 * @param errorType - エラーの種別
 */
export function trackArticleChatError(
	articleSlug: string | undefined,
	errorType: string
): void {
	trackEvent("ai_chat_error", {
		article_slug: articleSlug ?? "(none)",
		error_type: errorType,
	});
}
