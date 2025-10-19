import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { articlesRoute } from "@/routes/articles";
import { setupDbMocks } from "@/utils/drizzle-test";

// 翻訳サービスのモック
const mockTranslateArticle = vi.fn();
vi.mock("@/services/gemini-translation/gemini-translation", () => ({
	createTranslationService: vi.fn(() => ({
		translateArticle: mockTranslateArticle,
	})),
}));

// モック設定
vi.mock("@saneatsu/db/worker", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	tags: {},
	tagTranslations: {},
	users: {},
	createDatabaseClient: vi.fn(),
}));

vi.mock("@saneatsu/db", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	tags: {},
	tagTranslations: {},
	users: {},
	createDatabaseClient: vi.fn(),
}));

describe("PUT /articles/:id - 記事更新", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事を正常に更新する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([{ id: 1, slug: "old-slug" }]),
				}),
			}),
		};

		// スラッグ重複チェックのモック（重複なし）
		const duplicateSlugMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		// 更新後の記事取得のモック（GEMINI_API_KEYがないので3回目のselect呼び出し）
		const updatedArticleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								id: 1,
								slug: "updated-article",
								cfImageId: null,
								status: "published",
								publishedAt: "2024-01-01T00:00:00.000Z",
								updatedAt: "2024-01-02T00:00:00.000Z",
								title: "更新された記事",
								content: "これは更新された内容です。",
								viewCount: 0,
							},
						]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
			.mockReturnValueOnce(duplicateSlugMock) // スラッグ重複チェック
			.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得（英語翻訳はスキップ）

		// update関数のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		// delete関数のモック（タグ削除用）
		mockDb.delete = vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue({}),
		});

		// insert関数のモック（タグ追加用）
		mockDb.insert = vi.fn().mockReturnValue({
			values: vi.fn().mockResolvedValue({}),
		});

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].$put({
			param: { id: "1" },
			json: {
				title: "更新された記事",
				slug: "updated-article",
				content: "これは更新された内容です。",
				status: "published",
				tagIds: [1, 2],
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				id: 1,
				slug: "updated-article",
				cfImageId: null,
				status: "published",
				publishedAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
				title: "更新された記事",
				content: "これは更新された内容です。",
				viewCount: 0,
			},
			message: "記事が正常に更新されました",
		});

		expect(mockDb.update).toHaveBeenCalledTimes(2); // 記事と翻訳の更新
		expect(mockDb.delete).toHaveBeenCalledTimes(1); // タグ削除
		expect(mockDb.insert).toHaveBeenCalledTimes(1); // タグ追加
	});

	it("存在しないIDの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック（記事が見つからない）
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(existingArticleMock);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].$put({
			param: { id: "9999" },
			json: {
				title: "更新された記事",
				slug: "updated-article",
				content: "これは更新された内容です。",
				status: "published",
				tagIds: [1, 2],
			},
		});

		// Assert
		expect(res.status).toBe(404);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "NOT_FOUND",
				message: "Article not found",
			},
		});
	});

	it("スラッグが既に使用されている場合、409エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([{ id: 1, slug: "old-slug" }]),
				}),
			}),
		};

		// スラッグ重複チェックのモック（重複あり）
		const duplicateSlugMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([{ id: 2 }]),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
			.mockReturnValueOnce(duplicateSlugMock); // スラッグ重複チェック

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].$put({
			param: { id: "1" },
			json: {
				title: "更新された記事",
				slug: "existing-slug",
				content: "これは更新された内容です。",
				status: "published",
				tagIds: [1, 2],
			},
		});

		// Assert
		expect(res.status).toBe(409);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "SLUG_ALREADY_EXISTS",
				message: "このスラッグは既に使用されています",
			},
		});
	});

	describe("翻訳機能の改善", () => {
		it("GEMINI_API_KEYが設定されている場合、既存翻訳確認なしで日本語と英語の翻訳を直接更新する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// 翻訳が成功する場合のモック
			mockTranslateArticle.mockResolvedValue({
				title: "Updated Article",
				content: "This is updated content.",
			});

			// 既存記事チェックのモック
			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "old-slug" }]),
					}),
				}),
			};

			// スラッグ重複チェックのモック（重複なし）
			const duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// 更新後の記事取得のモック
			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "updated-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "更新された記事",
									content: "これは更新された内容です。",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			// 改善後: 既存翻訳確認のSELECTクエリがないため、3回のselect呼び出し
			mockDb.select
				.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
				.mockReturnValueOnce(duplicateSlugMock) // スラッグ重複チェック
				.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得

			// update関数のモック
			mockDb.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue({}),
				}),
			});

			// delete関数のモック（タグ削除用）
			mockDb.delete = vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			});

			// insert関数のモック（タグ追加用）
			mockDb.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockResolvedValue({}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "更新された記事",
					slug: "updated-article",
					content: "これは更新された内容です。",
					status: "published",
					tagIds: [1, 2],
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.message).toBe("記事が正常に更新されました");

			// 改善後の検証: SELECTは3回のみ（既存翻訳確認がない）
			expect(mockDb.select).toHaveBeenCalledTimes(3);

			// 改善後の検証: UPDATEは3回（記事 + 日本語翻訳 + 英語翻訳）
			expect(mockDb.update).toHaveBeenCalledTimes(3);

			// 翻訳サービスが呼ばれたことを確認
			expect(mockTranslateArticle).toHaveBeenCalledWith(
				"更新された記事",
				"これは更新された内容です。"
			);
		});

		it("GEMINI_API_KEYが設定されていない場合、日本語の翻訳のみ更新する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// 既存記事チェックのモック
			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "old-slug" }]),
					}),
				}),
			};

			// スラッグ重複チェックのモック（重複なし）
			const duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// 更新後の記事取得のモック
			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "updated-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "更新された記事",
									content: "これは更新された内容です。",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
				.mockReturnValueOnce(duplicateSlugMock) // スラッグ重複チェック
				.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得

			// update関数のモック
			mockDb.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue({}),
				}),
			});

			// delete関数のモック（タグ削除用）
			mockDb.delete = vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			});

			// insert関数のモック（タグ追加用）
			mockDb.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockResolvedValue({}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				// GEMINI_API_KEY未設定
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "更新された記事",
					slug: "updated-article",
					content: "これは更新された内容です。",
					status: "published",
					tagIds: [1, 2],
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// UPDATEは2回のみ（記事 + 日本語翻訳のみ）
			expect(mockDb.update).toHaveBeenCalledTimes(2);

			// 翻訳サービスは呼ばれない
			expect(mockTranslateArticle).not.toHaveBeenCalled();
		});

		it("翻訳が失敗しても日本語の翻訳は更新され、処理は続行される", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// 翻訳が失敗する場合のモック
			mockTranslateArticle.mockResolvedValue(null);

			// 既存記事チェックのモック
			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "old-slug" }]),
					}),
				}),
			};

			// スラッグ重複チェックのモック（重複なし）
			const duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// 更新後の記事取得のモック
			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "updated-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "更新された記事",
									content: "これは更新された内容です。",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
				.mockReturnValueOnce(duplicateSlugMock) // スラッグ重複チェック
				.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得

			// update関数のモック
			mockDb.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue({}),
				}),
			});

			// delete関数のモック（タグ削除用）
			mockDb.delete = vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			});

			// insert関数のモック（タグ追加用）
			mockDb.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockResolvedValue({}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "更新された記事",
					slug: "updated-article",
					content: "これは更新された内容です。",
					status: "published",
					tagIds: [1, 2],
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// 翻訳が失敗しても、記事更新と日本語翻訳は成功
			// UPDATEは2回（記事 + 日本語翻訳のみ、英語翻訳は失敗したのでスキップ）
			expect(mockDb.update).toHaveBeenCalledTimes(2);
		});
	});
});
