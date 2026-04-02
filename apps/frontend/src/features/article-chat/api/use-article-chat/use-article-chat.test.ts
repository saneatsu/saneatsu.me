import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- モック ---
const { mockTranslations } = vi.hoisted(() => ({
	mockTranslations: vi.fn((key: string) => key),
}));

vi.mock("next-intl", () => ({
	useTranslations: () => mockTranslations,
}));

vi.mock("@/app/api/article-chat/route", () => ({
	MAX_MESSAGE_LENGTH: 500,
}));

vi.mock("../../model/article-chat-error-code", () => ({
	ARTICLE_CHAT_ERROR_CODES: [
		"INVALID_REQUEST",
		"REQUIRED_FIELDS",
		"MESSAGE_TOO_LONG",
		"AI_UNAVAILABLE",
		"RATE_LIMIT_EXCEEDED",
		"GENERATION_FAILED",
		"ARTICLES_FETCH_FAILED",
	],
}));

import { useArticleChat } from "./use-article-chat";

/** fetch のモックレスポンスを生成するヘルパー */
function createMockResponse(
	status: number,
	body?: { error?: string } | ReadableStream
) {
	if (body instanceof ReadableStream) {
		return {
			ok: status >= 200 && status < 300,
			body,
			json: vi.fn(),
		};
	}
	return {
		ok: status >= 200 && status < 300,
		body: null,
		json: vi.fn().mockResolvedValue(body ?? {}),
	};
}

/** 正常系のストリーミングレスポンスを作成する */
function createStreamResponse(text: string) {
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(new TextEncoder().encode(text));
			controller.close();
		},
	});
	return createMockResponse(200, stream);
}

beforeEach(() => {
	vi.restoreAllMocks();
	// crypto.randomUUID のモック
	let counter = 0;
	vi.stubGlobal("crypto", {
		...crypto,
		randomUUID: () => `test-uuid-${++counter}`,
	});
});

const defaultOptions = {
	currentArticleSlug: "test-article",
	language: "ja" as const,
};

describe("useArticleChat", () => {
	describe("Unit Test", () => {
		describe("リトライ機能", () => {
			it("429エラー時にcanRetryがtrueになる", async () => {
				// Given: RATE_LIMIT_EXCEEDED エラーを返すAPIレスポンス
				vi.stubGlobal(
					"fetch",
					vi
						.fn()
						.mockResolvedValue(
							createMockResponse(429, { error: "RATE_LIMIT_EXCEEDED" })
						)
				);

				const { result } = renderHook(() => useArticleChat(defaultOptions));

				// When: メッセージを送信して429エラーが発生
				await act(async () => {
					await result.current.sendMessage("テストメッセージ");
				});

				// Then: canRetryがtrueになる
				expect(result.current.canRetry).toBe(true);
			});

			it("retry()で前回のメッセージが再送信される", async () => {
				// Given: 最初のリクエストで429エラーを返し、リトライでは成功する
				const fetchMock = vi
					.fn()
					.mockResolvedValueOnce(
						createMockResponse(429, { error: "RATE_LIMIT_EXCEEDED" })
					)
					.mockResolvedValueOnce(createStreamResponse("成功レスポンス"));

				vi.stubGlobal("fetch", fetchMock);

				const { result } = renderHook(() => useArticleChat(defaultOptions));

				// 最初のメッセージを送信して429エラー
				await act(async () => {
					await result.current.sendMessage("テストメッセージ");
				});
				expect(result.current.canRetry).toBe(true);

				// When: retry()を呼び出す
				await act(async () => {
					await result.current.retry();
				});

				// Then: 前回のメッセージで再度fetchが呼ばれる
				expect(fetchMock).toHaveBeenCalledTimes(2);
				const secondCallBody = JSON.parse(
					fetchMock.mock.calls[1][1].body as string
				);
				expect(secondCallBody.message).toBe("テストメッセージ");
			});

			it("retry成功後にcanRetryがfalseに戻る", async () => {
				// Given: 最初のリクエストで429エラー、リトライで成功
				const fetchMock = vi
					.fn()
					.mockResolvedValueOnce(
						createMockResponse(429, { error: "RATE_LIMIT_EXCEEDED" })
					)
					.mockResolvedValueOnce(createStreamResponse("成功レスポンス"));

				vi.stubGlobal("fetch", fetchMock);

				const { result } = renderHook(() => useArticleChat(defaultOptions));

				await act(async () => {
					await result.current.sendMessage("テストメッセージ");
				});

				// When: retry()を呼び出して成功
				await act(async () => {
					await result.current.retry();
				});

				// Then: canRetryがfalseに戻る
				expect(result.current.canRetry).toBe(false);
			});

			it("429以外のエラーではcanRetryがfalseのまま", async () => {
				// Given: GENERATION_FAILED（500エラー）を返すAPIレスポンス
				vi.stubGlobal(
					"fetch",
					vi
						.fn()
						.mockResolvedValue(
							createMockResponse(500, { error: "GENERATION_FAILED" })
						)
				);

				const { result } = renderHook(() => useArticleChat(defaultOptions));

				// When: メッセージを送信して500エラーが発生
				await act(async () => {
					await result.current.sendMessage("テストメッセージ");
				});

				// Then: canRetryがfalseのまま
				expect(result.current.canRetry).toBe(false);
			});
		});
	});
});
