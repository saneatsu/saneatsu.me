// @vitest-environment node
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * vitest.setup.mts で next/server がモックされているため、
 * API Route テストでは実際の NextResponse を使うためにモックを解除する
 */
vi.unmock("next/server");

// @google/generative-ai のモック
const { mockGenerateContentStream } = vi.hoisted(() => ({
	mockGenerateContentStream: vi.fn(),
}));

// vitest v4ではアロー関数をコンストラクタとして使えないためfunction構文を使用
vi.mock("@google/generative-ai", () => ({
	// biome-ignore lint/complexity/useArrowFunction: vitest v4ではnew演算子で呼ばれるモックにfunction構文が必須
	GoogleGenerativeAI: vi.fn().mockImplementation(function () {
		return {
			getGenerativeModel: vi.fn().mockReturnValue({
				generateContentStream: mockGenerateContentStream,
			}),
		};
	}),
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

/** 正常なストリームレスポンスを返すモックを設定する */
function setupSuccessfulStream(text = "AIの回答なのだ") {
	mockGenerateContentStream.mockResolvedValue({
		stream: (async function* () {
			yield { text: () => text };
		})(),
	});
}

describe("POST /api/article-chat", () => {
	const originalEnv = process.env.GEMINI_API_KEY;

	beforeEach(() => {
		process.env.GEMINI_API_KEY = "test-api-key";
		mockGenerateContentStream.mockReset();
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
				const request = createRequest({ articleContent: "記事の内容" });

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("REQUIRED_FIELDS");
			});

			it("should return 400 when articleContent is missing", async () => {
				// Given: articleContent is not provided
				const { POST } = await import("./route");
				const request = createRequest({ message: "質問です" });

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("REQUIRED_FIELDS");
			});

			it("should return 400 when both message and articleContent are missing", async () => {
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
					articleContent: "記事の内容",
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
					articleContent: "記事の内容",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 200 with normal stream is returned
				expect(response.status).toBe(200);
			});

			it("should return 400 when articleContent exceeds 100000 characters", async () => {
				// Given: 100001 characters articleContent (boundary value exceeded)
				const { POST } = await import("./route");
				const request = createRequest({
					message: "質問です",
					articleContent: "あ".repeat(100001),
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 400 error is returned
				expect(response.status).toBe(400);
				const body = await response.json();
				expect(body.error).toBe("CONTENT_TOO_LARGE");
			});
		});

		describe("GEMINI_API_KEY", () => {
			it("should return 500 when GEMINI_API_KEY is not set", async () => {
				// Given: API key is not set
				process.env.GEMINI_API_KEY = "";
				const { POST } = await import("./route");
				const request = createRequest({
					message: "質問です",
					articleContent: "記事の内容",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 500 error is returned
				expect(response.status).toBe(500);
				const body = await response.json();
				expect(body.error).toBe("AI_UNAVAILABLE");
			});
		});

		describe("streaming response", () => {
			it("should return streaming response for valid request", async () => {
				// Given: valid request and Gemini API mock
				setupSuccessfulStream("これはAIの回答です");
				const { POST } = await import("./route");
				const request = createRequest({
					message: "質問です",
					articleContent: "記事の内容",
				});

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

			it("should return 429 when Gemini API returns rate limit error", async () => {
				// Given: Gemini API returns 429 error
				mockGenerateContentStream.mockRejectedValue(
					new Error("[GoogleGenerativeAI Error]: 429 Too Many Requests")
				);
				const consoleErrorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});
				const { POST } = await import("./route");
				const request = createRequest({
					message: "質問です",
					articleContent: "記事の内容",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 429 error is returned as JSON response
				expect(response.status).toBe(429);
				const body = await response.json();
				expect(body.error).toBe("RATE_LIMIT_EXCEEDED");
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					"Gemini API error:",
					expect.any(Error)
				);
				consoleErrorSpy.mockRestore();
			});

			it("should return 500 when Gemini API returns unexpected error", async () => {
				// Given: Gemini API returns unexpected error
				mockGenerateContentStream.mockRejectedValue(
					new Error("Unexpected error")
				);
				const consoleErrorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});
				const { POST } = await import("./route");
				const request = createRequest({
					message: "質問です",
					articleContent: "記事の内容",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: 500 error is returned as JSON response
				expect(response.status).toBe(500);
				const body = await response.json();
				expect(body.error).toBe("GENERATION_FAILED");
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					"Gemini API error:",
					expect.any(Error)
				);
				consoleErrorSpy.mockRestore();
			});

			it("should throw stream error when error occurs during streaming", async () => {
				// Given: error occurs during stream reading
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
				const request = createRequest({
					message: "質問です",
					articleContent: "記事の内容",
				});

				// When: send POST request
				const response = await POST(request);

				// Then: stream reading throws error
				expect(response.status).toBe(200);
				await expect(readStream(response)).rejects.toThrow();
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					"Gemini stream error:",
					expect.any(Error)
				);
				consoleErrorSpy.mockRestore();
			});
		});
	});
});
