import { beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiTranslationService } from "./gemini-translation";

// GoogleGenerativeAIのモック
vi.mock("@google/generative-ai", () => {
	return {
		GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
			getGenerativeModel: vi.fn().mockReturnValue({
				generateContent: vi.fn(),
			}),
		})),
	};
});

describe("GeminiTranslationService", () => {
	let service: GeminiTranslationService;
	let mockGenerateContent: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// モックをリセット
		vi.clearAllMocks();

		// サービスのインスタンスを作成
		service = new GeminiTranslationService("test-api-key");

		// generateContentのモックを設定
		mockGenerateContent = vi.fn();
		// @ts-ignore - プライベートプロパティへのアクセス
		service.model.generateContent = mockGenerateContent;
	});

	describe("translateArticle", () => {
		it("記事を正常に翻訳する", async () => {
			// モックレスポンスを設定
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => `TITLE: Test Article in English
CONTENT:
This is the translated content.
It preserves Markdown format.`,
				},
			});

			const result = await service.translateArticle(
				"テスト記事",
				"これはテストコンテンツです。\nMarkdown形式を保持します。"
			);

			expect(result).toEqual({
				title: "Test Article in English",
				content:
					"This is the translated content.\nIt preserves Markdown format.",
			});

			// プロンプトが正しく生成されていることを確認
			expect(mockGenerateContent).toHaveBeenCalledTimes(1);
			const prompt = mockGenerateContent.mock.calls[0][0];
			expect(prompt).toContain("テスト記事");
			expect(prompt).toContain("これはテストコンテンツです。");
		});

		it("WikiLink記法を保持して翻訳する", async () => {
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => `TITLE: Article with WikiLink
CONTENT:
This article references [[Other Article]].
The WikiLink format is preserved.`,
				},
			});

			const result = await service.translateArticle(
				"WikiLinkを含む記事",
				"この記事は[[他の記事]]を参照しています。\nWikiLink形式が保持されます。"
			);

			expect(result).not.toBeNull();
			expect(result?.content).toContain("[[Other Article]]");
		});

		it("翻訳が失敗した場合はnullを返す", async () => {
			// エラーをスローするモック
			mockGenerateContent.mockRejectedValue(new Error("API Error"));

			const result = await service.translateArticle(
				"エラーテスト",
				"エラーが発生します"
			);

			expect(result).toBeNull();
		});

		it("レスポンスのパースに失敗した場合はnullを返す", async () => {
			// 不正な形式のレスポンス
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => "Invalid response format",
				},
			});

			const result = await service.translateArticle(
				"パースエラーテスト",
				"パースエラーが発生します"
			);

			expect(result).toBeNull();
		});
	});

	describe("shouldTranslate", () => {
		it("既存の翻訳がない場合はtrueを返す", () => {
			const result = service.shouldTranslate("新しいコンテンツ", null);
			expect(result).toBe(true);
		});

		it("既存の翻訳がundefinedの場合はtrueを返す", () => {
			const result = service.shouldTranslate("新しいコンテンツ", undefined);
			expect(result).toBe(true);
		});

		it("コンテンツが変更されている場合はtrueを返す", () => {
			const result = service.shouldTranslate(
				"新しいコンテンツ",
				"古いコンテンツ"
			);
			expect(result).toBe(true);
		});

		it("コンテンツが同じ場合はfalseを返す", () => {
			const result = service.shouldTranslate(
				"同じコンテンツ",
				"同じコンテンツ"
			);
			expect(result).toBe(false);
		});
	});

	describe("translateBatch", () => {
		it("複数の記事を順次翻訳する", async () => {
			// タイマーのモック
			vi.useFakeTimers();

			// 各記事の翻訳結果を設定
			mockGenerateContent
				.mockResolvedValueOnce({
					response: {
						text: () => `TITLE: Article 1 English
CONTENT:
Content 1 translated`,
					},
				})
				.mockResolvedValueOnce({
					response: {
						text: () => `TITLE: Article 2 English
CONTENT:
Content 2 translated`,
					},
				});

			const articlesPromise = service.translateBatch([
				{ title: "記事1", content: "コンテンツ1" },
				{ title: "記事2", content: "コンテンツ2" },
			]);

			// タイマーを進める
			await vi.runAllTimersAsync();

			const results = await articlesPromise;

			expect(results).toHaveLength(2);
			expect(results[0]).toEqual({
				title: "Article 1 English",
				content: "Content 1 translated",
			});
			expect(results[1]).toEqual({
				title: "Article 2 English",
				content: "Content 2 translated",
			});

			// 各翻訳が呼ばれたことを確認
			expect(mockGenerateContent).toHaveBeenCalledTimes(2);

			vi.useRealTimers();
		});

		it("一部の翻訳が失敗してもバッチ処理を続行する", async () => {
			vi.useFakeTimers();

			// 2番目の記事でエラーを発生させる
			mockGenerateContent
				.mockResolvedValueOnce({
					response: {
						text: () => `TITLE: Article 1 English
CONTENT:
Content 1 translated`,
					},
				})
				.mockRejectedValueOnce(new Error("API Error"))
				.mockResolvedValueOnce({
					response: {
						text: () => `TITLE: Article 3 English
CONTENT:
Content 3 translated`,
					},
				});

			const articlesPromise = service.translateBatch([
				{ title: "記事1", content: "コンテンツ1" },
				{ title: "記事2", content: "コンテンツ2" },
				{ title: "記事3", content: "コンテンツ3" },
			]);

			await vi.runAllTimersAsync();
			const results = await articlesPromise;

			expect(results).toHaveLength(3);
			expect(results[0]).not.toBeNull();
			expect(results[1]).toBeNull(); // エラーが発生した記事
			expect(results[2]).not.toBeNull();

			vi.useRealTimers();
		});
	});

	describe("translateTag", () => {
		it("タグ名を日本語から英語に翻訳する", async () => {
			// モックレスポンスを設定
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => "typescript",
				},
			});

			const result = await service.translateTag("タイプスクリプト");

			expect(result).toBe("typescript");

			// プロンプトが正しく生成されていることを確認
			expect(mockGenerateContent).toHaveBeenCalledTimes(1);
			const prompt = mockGenerateContent.mock.calls[0][0];
			expect(prompt).toContain("タイプスクリプト");
		});

		it("翻訳が失敗した場合はnullを返す", async () => {
			// エラーをスローするモック
			mockGenerateContent.mockRejectedValue(new Error("API Error"));

			const result = await service.translateTag("エラーテスト");

			expect(result).toBeNull();
		});

		it("レスポンスが空の場合はnullを返す", async () => {
			// 空のレスポンス
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => "",
				},
			});

			const result = await service.translateTag("空レスポンステスト");

			expect(result).toBeNull();
		});
	});
});

describe("createTranslationService", () => {
	it("API keyが設定されている場合はサービスインスタンスを返す", async () => {
		// 動的インポートで関数を取得
		const { createTranslationService } = await import("./gemini-translation");

		const env = { GEMINI_API_KEY: "test-key" };
		const service = createTranslationService(env);

		expect(service).toBeInstanceOf(GeminiTranslationService);
	});

	it("API keyが設定されていない場合はエラーをスローする", async () => {
		// 動的インポートで関数を取得
		const { createTranslationService } = await import("./gemini-translation");

		const env = { GEMINI_API_KEY: "" };

		expect(() => createTranslationService(env)).toThrow(
			"GEMINI_API_KEY is not configured"
		);
	});
});
