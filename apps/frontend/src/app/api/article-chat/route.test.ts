// @vitest-environment node
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * vitest.setup.mts で next/server がモックされているため、
 * API Route テストでは実際の NextResponse を使うためにモックを解除する
 */
vi.unmock("next/server");

// @google/generative-ai のモック
const { mockGenerateContent, mockGenerateContentStream } = vi.hoisted(() => ({
	mockGenerateContent: vi.fn(),
	mockGenerateContentStream: vi.fn(),
}));

// getGenerativeModelのモック（systemInstructionの検証用に参照を保持する）
const { mockGetGenerativeModel } = vi.hoisted(() => ({
	mockGetGenerativeModel: vi.fn(),
}));

// vitest v4ではアロー関数をコンストラクタとして使えないためfunction構文を使用
vi.mock("@google/generative-ai", () => ({
	// biome-ignore lint/complexity/useArrowFunction: vitest v4ではnew演算子で呼ばれるモックにfunction構文が必須
	GoogleGenerativeAI: vi.fn().mockImplementation(function () {
		return {
			getGenerativeModel: mockGetGenerativeModel.mockReturnValue({
				generateContent: mockGenerateContent,
				generateContentStream: mockGenerateContentStream,
			}),
		};
	}),
	SchemaType: {
		OBJECT: "object",
		STRING: "string",
	},
}));

// 記事取得関数のモック
const { mockFetchArticlesForChat, mockFetchArticleContentForChat } = vi.hoisted(
	() => ({
		mockFetchArticlesForChat: vi.fn(),
		mockFetchArticleContentForChat: vi.fn(),
	})
);

vi.mock("./fetch-articles-for-chat", () => ({
	fetchArticlesForChat: mockFetchArticlesForChat,
}));

vi.mock("./fetch-article-content-for-chat", () => ({
	fetchArticleContentForChat: mockFetchArticleContentForChat,
}));

/** テスト用のNextRequestを生成する */
function createRequest(
	body: unknown,
	options?: { invalidJson?: boolean }
): NextRequest {
	if (options?.invalidJson) {
		return new Request("http://localhost/api/article-chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "invalid json{{{",
		}) as unknown as NextRequest;
	}
	return new Request("http://localhost/api/article-chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

/** ストリームからテキストを読み取る */
async function readStream(response: Response): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) throw new Error("No body");
	const decoder = new TextDecoder();
	let result = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		result += decoder.decode(value, { stream: true });
	}
	return result;
}

/** テスト用の記事一覧データ */
const testArticles = [
	{ slug: "nextjs-basics", title: "Next.jsの基本" },
	{ slug: "react-hooks", title: "React Hooksの使い方" },
];

/** Function Callなしの正常なレスポンスを設定する */
function setupNonFunctionCallResponse() {
	mockGenerateContent.mockResolvedValue({
		response: {
			candidates: [
				{
					content: {
						parts: [{ text: "テキスト回答" }],
					},
				},
			],
		},
	});
}

/** 正常なストリームレスポンスを返すモックを設定する */
function setupSuccessfulStream(text = "AIの回答なのだ") {
	mockFetchArticlesForChat.mockResolvedValue(testArticles);
	setupNonFunctionCallResponse();
	mockGenerateContentStream.mockResolvedValue({
		stream: (async function* () {
			yield { text: () => text };
		})(),
	});
}

/** 有効なリクエストボディ */
const validBody = { message: "質問です", language: "ja" };

describe("POST /api/article-chat", () => {
	const originalEnv = process.env.GEMINI_API_KEY;

	beforeEach(() => {
		process.env.GEMINI_API_KEY = "test-api-key";
		mockGenerateContent.mockReset();
		mockGenerateContentStream.mockReset();
		mockGetGenerativeModel.mockClear();
		mockFetchArticlesForChat.mockReset();
		mockFetchArticleContentForChat.mockReset();
	});

	afterEach(() => {
		process.env.GEMINI_API_KEY = originalEnv;
	});

	describe("Unit Test", () => {
		describe("request validation", () => {
			it("should return 400 for invalid JSON", async () => {
				// Given: invalid JSON body
				const { POST } = await import("./route");
				const request = createRequest(null, { invalidJson: true });

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("INVALID_REQUEST");
			});

			it("should return 400 when message is missing", async () => {
				// Given: message is not provided
				const { POST } = await import("./route");
				const request = createRequest({ language: "ja" });

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("REQUIRED_FIELDS");
			});

			it("should return 400 when language is missing", async () => {
				// Given: language is not provided
				const { POST } = await import("./route");
				const request = createRequest({ message: "質問です" });

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("REQUIRED_FIELDS");
			});

			it("should return 400 when both message and language are missing", async () => {
				// Given: empty object
				const { POST } = await import("./route");
				const request = createRequest({});

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("REQUIRED_FIELDS");
			});

			it("should return 400 when message exceeds 2000 characters", async () => {
				// Given: 2001 characters message (boundary value exceeded)
				const { POST } = await import("./route");
				const request = createRequest({
					message: "あ".repeat(2001),
					language: "ja",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("MESSAGE_TOO_LONG");
			});

			it("should succeed when message is exactly 2000 characters", async () => {
				// Given: 2000 characters message (boundary value exact)
				setupSuccessfulStream();
				const { POST } = await import("./route");
				const request = createRequest({
					message: "あ".repeat(2000),
					language: "ja",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 200 with normal stream is returned
				expect(response.status).toBe(200);
			});
		});

		describe("GEMINI_API_KEY", () => {
			it("should return 500 when GEMINI_API_KEY is not set", async () => {
				// Given: API key is not set
				process.env.GEMINI_API_KEY = "";
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: 500 error is returned
				expect(response.status).toBe(500);
				const body = await response.json();
				expect(body.error).toBe("AI_UNAVAILABLE");
			});
		});

		describe("articles fetch", () => {
			it("should return 500 when article list fetch fails", async () => {
				// Given: fetchArticlesForChat throws
				mockFetchArticlesForChat.mockRejectedValue(new Error("Network error"));
				const consoleErrorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: 500 error with ARTICLES_FETCH_FAILED is returned
				expect(response.status).toBe(500);
				const body = await response.json();
				expect(body.error).toBe("ARTICLES_FETCH_FAILED");
				consoleErrorSpy.mockRestore();
			});
		});

		describe("streaming response", () => {
			it("should return streaming response for valid request", async () => {
				// Given: valid request and Gemini API mock
				setupSuccessfulStream("これはAIの回答です");
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: streaming response is returned
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toBe(
					"text/plain; charset=utf-8"
				);
				const text = await readStream(response);
				expect(text).toBe("これはAIの回答です");
			});

			it("should accept optional currentArticleSlug", async () => {
				// Given: request with currentArticleSlug
				setupSuccessfulStream("記事についての回答");
				const { POST } = await import("./route");
				const request = createRequest({
					...validBody,
					currentArticleSlug: "nextjs-basics",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 200 with normal stream is returned
				expect(response.status).toBe(200);
				const text = await readStream(response);
				expect(text).toBe("記事についての回答");
			});

			it("should return 429 when Gemini API returns rate limit error", async () => {
				// Given: Gemini API returns 429 error
				mockFetchArticlesForChat.mockResolvedValue(testArticles);
				setupNonFunctionCallResponse();
				mockGenerateContentStream.mockRejectedValue(
					new Error("[GoogleGenerativeAI Error]: 429 Too Many Requests")
				);
				const consoleErrorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: 429 error is returned as JSON response
				expect(response.status).toBe(429);
				const body = await response.json();
				expect(body.error).toBe("RATE_LIMIT_EXCEEDED");
				consoleErrorSpy.mockRestore();
			});

			it("should return 500 when Gemini API returns unexpected error", async () => {
				// Given: Gemini API returns unexpected error during generateContent
				mockFetchArticlesForChat.mockResolvedValue(testArticles);
				mockGenerateContent.mockRejectedValue(new Error("Unexpected error"));
				const consoleErrorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: 500 error is returned as JSON response
				expect(response.status).toBe(500);
				const body = await response.json();
				expect(body.error).toBe("GENERATION_FAILED");
				consoleErrorSpy.mockRestore();
			});

			it("should throw stream error when error occurs during streaming", async () => {
				// Given: error occurs during stream reading
				mockFetchArticlesForChat.mockResolvedValue(testArticles);
				setupNonFunctionCallResponse();
				mockGenerateContentStream.mockResolvedValue({
					stream: (async function* () {
						yield { text: () => "部分的な" };
						throw new Error("Stream interrupted");
					})(),
				});
				const consoleErrorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: stream reading throws error
				expect(response.status).toBe(200);
				await expect(readStream(response)).rejects.toThrow();
				consoleErrorSpy.mockRestore();
			});
		});

		describe("buildSystemPrompt", () => {
			it("should include instruction to output article references as Markdown links", async () => {
				// Given: 正常なリクエストとモック設定
				setupSuccessfulStream();
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: POSTリクエストを送信
				await POST(request);

				// Then: systemInstructionに記事リンク形式の指示が含まれる
				const systemInstruction =
					mockGetGenerativeModel.mock.calls[0][0].systemInstruction;
				expect(systemInstruction).toContain("[Article Title](/blog/slug)");
			});

			it("should include instruction to output external URLs as Markdown links", async () => {
				// Given: 正常なリクエストとモック設定
				setupSuccessfulStream();
				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: POSTリクエストを送信
				await POST(request);

				// Then: systemInstructionに外部リンク形式の指示が含まれる
				const systemInstruction =
					mockGetGenerativeModel.mock.calls[0][0].systemInstruction;
				expect(systemInstruction).toContain("Markdown");
				expect(systemInstruction).toMatch(/https?:\/\//);
			});
		});

		describe("Function Calling", () => {
			it("should handle Function Call and return article content", async () => {
				// Given: Gemini returns a Function Call, then text after receiving content
				mockFetchArticlesForChat.mockResolvedValue(testArticles);
				mockFetchArticleContentForChat.mockResolvedValue(
					"# Next.jsの基本\nNext.jsの記事内容"
				);

				// 1回目: Function Call を返す
				mockGenerateContent
					.mockResolvedValueOnce({
						response: {
							candidates: [
								{
									content: {
										parts: [
											{
												functionCall: {
													name: "get_article_content",
													args: { slug: "nextjs-basics" },
												},
											},
										],
									},
								},
							],
						},
					})
					// 2回目: テキスト応答を返す（Function Callなし → ストリーミングへ）
					.mockResolvedValueOnce({
						response: {
							candidates: [
								{
									content: {
										parts: [{ text: "記事の内容を元に回答します" }],
									},
								},
							],
						},
					});

				mockGenerateContentStream.mockResolvedValue({
					stream: (async function* () {
						yield { text: () => "Function Calling経由の回答" };
					})(),
				});

				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: streaming response with Function Call result
				expect(response.status).toBe(200);
				const text = await readStream(response);
				expect(text).toBe("Function Calling経由の回答");
				expect(mockFetchArticleContentForChat).toHaveBeenCalledWith(
					"nextjs-basics",
					"ja"
				);
			});

			it("should handle non-existent article in Function Call", async () => {
				// Given: Gemini requests an article that doesn't exist
				mockFetchArticlesForChat.mockResolvedValue(testArticles);
				mockFetchArticleContentForChat.mockResolvedValue(null);

				mockGenerateContent
					.mockResolvedValueOnce({
						response: {
							candidates: [
								{
									content: {
										parts: [
											{
												functionCall: {
													name: "get_article_content",
													args: { slug: "non-existent" },
												},
											},
										],
									},
								},
							],
						},
					})
					.mockResolvedValueOnce({
						response: {
							candidates: [
								{
									content: {
										parts: [{ text: "その記事は見つかりません" }],
									},
								},
							],
						},
					});

				mockGenerateContentStream.mockResolvedValue({
					stream: (async function* () {
						yield { text: () => "記事が見つかりませんでした" };
					})(),
				});

				const { POST } = await import("./route");
				const request = createRequest(validBody);

				// When: send POST request
				const response = await POST(request);

				// Then: 200 response is returned (Gemini handles the missing article gracefully)
				expect(response.status).toBe(200);
			});
		});
	});
});
