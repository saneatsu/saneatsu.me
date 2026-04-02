"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { MAX_MESSAGE_LENGTH } from "@/app/api/article-chat/route";
import type { LanguageCode } from "@/shared/model";

import type { ArticleChatErrorCode } from "../../model/article-chat-error-code";
import { ARTICLE_CHAT_ERROR_CODES } from "../../model/article-chat-error-code";
import type { ChatMessage } from "../../model/chat-message";

interface UseArticleChatOptions {
	/** 現在閲覧中の記事のslug（記事ページから開いた場合のみ） */
	currentArticleSlug?: string;
	/** 記事翻訳の言語 */
	language: LanguageCode;
}

interface UseArticleChatReturn {
	/** チャットメッセージの履歴 */
	messages: ChatMessage[];
	/** ストリーミングリクエスト中かどうか */
	isLoading: boolean;
	/** エラーメッセージ（エラーがない場合はnull） */
	error: string | null;
	/** ユーザーメッセージを送信する */
	sendMessage: (message: string) => Promise<void>;
	/** メッセージ履歴をクリアする */
	clearMessages: () => void;
	/** 429エラー時にリトライ可能かどうか */
	canRetry: boolean;
	/** 前回のメッセージを再送信する */
	retry: () => Promise<void>;
}

/**
 * 横断AIチャットの状態管理フック
 *
 * @description
 * 1. ユーザーメッセージを messages に追加
 * 2. /api/article-chat にストリーミングリクエストを送信（AbortController付き）
 * 3. ReadableStreamDefaultReader でチャンクを逐次受信し assistant メッセージに append
 * 4. ストリーム終了またはエラー時に isLoading を false に戻す
 * 5. コンポーネントアンマウント時にリクエストをキャンセルしリソースを解放する
 */
export function useArticleChat({
	currentArticleSlug,
	language,
}: UseArticleChatOptions): UseArticleChatReturn {
	const t = useTranslations("articleChat");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [canRetry, setCanRetry] = useState(false);

	/**
	 * isLoading を useRef で管理し、useCallback の依存配列から除外する
	 * これにより sendMessage の参照が不要に変わることを防ぐ
	 */
	const isLoadingRef = useRef(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	/** リトライ用に前回送信したメッセージを保持する */
	const lastMessageRef = useRef<string | null>(null);

	// コンポーネントアンマウント時にリクエストをキャンセル
	useEffect(() => {
		return () => {
			abortControllerRef.current?.abort();
		};
	}, []);

	const sendMessage = useCallback(
		async (message: string) => {
			if (!message.trim() || isLoadingRef.current) return;

			// リトライ用にメッセージを保持
			lastMessageRef.current = message;

			// 1. ユーザーメッセージを追加
			const userMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "user",
				content: message.trim(),
			};
			setMessages((prev) => [...prev, userMessage]);
			isLoadingRef.current = true;
			setIsLoading(true);
			setError(null);
			setCanRetry(false);

			// 2. アシスタントの空メッセージ（ストリーミング中）を追加
			const assistantMessageId = crypto.randomUUID();
			setMessages((prev) => [
				...prev,
				{
					id: assistantMessageId,
					role: "assistant",
					content: "",
					isStreaming: true,
				},
			]);

			// 3. AbortController を作成してリクエストをキャンセル可能にする
			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				const response = await fetch("/api/article-chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message,
						currentArticleSlug,
						language,
					}),
					signal: controller.signal,
				});

				if (!response.ok || !response.body) {
					const errorData = await response.json().catch(() => null);
					const errorCode = errorData?.error as string | undefined;
					// ランタイムでの型ガード（APIから返された文字列が有効なエラーコードかを判定）
					const isKnownErrorCode =
						errorCode !== undefined &&
						ARTICLE_CHAT_ERROR_CODES.includes(
							errorCode as ArticleChatErrorCode
						);

					// レートリミットエラーの場合はリトライ可能にする
					if (errorCode === "RATE_LIMIT_EXCEEDED") {
						setCanRetry(true);
					}

					const errorMessage = isKnownErrorCode
						? t(`error.${errorCode as ArticleChatErrorCode}`, {
								maxLength: MAX_MESSAGE_LENGTH,
							})
						: t("error.fetchFailed");
					throw new Error(errorMessage);
				}

				// 4. ストリームを読み取ってアシスタントメッセージを更新
				const reader = response.body.getReader();
				const decoder = new TextDecoder();

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunk = decoder.decode(value, { stream: true });
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === assistantMessageId
									? { ...msg, content: msg.content + chunk }
									: msg
							)
						);
					}
				} finally {
					reader.releaseLock();
				}

				// 5. ストリーミング完了
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
					)
				);
			} catch (err) {
				// AbortError はユーザーによるキャンセルなのでエラー表示しない
				if (err instanceof DOMException && err.name === "AbortError") return;

				setError(err instanceof Error ? err.message : t("error.unknown"));
				// エラー時はストリーミング中の空メッセージを削除
				setMessages((prev) =>
					prev.filter((msg) => msg.id !== assistantMessageId)
				);
			} finally {
				isLoadingRef.current = false;
				setIsLoading(false);
			}
		},
		[currentArticleSlug, language, t]
	);

	/** 前回のメッセージを再送信する */
	const retry = useCallback(async () => {
		if (!lastMessageRef.current) return;
		await sendMessage(lastMessageRef.current);
	}, [sendMessage]);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setError(null);
		setCanRetry(false);
	}, []);

	return {
		messages,
		isLoading,
		error,
		sendMessage,
		clearMessages,
		canRetry,
		retry,
	};
}
