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
	articleGalleryImages: {},
	galleryImages: {},
	tags: {},
	tagTranslations: {},
	users: {},
	createDatabaseClient: vi.fn(),
}));

vi.mock("@saneatsu/db", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	articleGalleryImages: {},
	galleryImages: {},
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

		// 翻訳サービスのモック設定（正常な翻訳結果を返す）
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

		// insert関数のモック（タグ追加用、Upsertサポート）
		mockDb.insert = vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				onConflictDoUpdate: vi.fn().mockResolvedValue({}),
			}),
		});

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
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

		expect(mockDb.update).toHaveBeenCalledTimes(1); // 記事の更新
		expect(mockDb.delete).toHaveBeenCalledTimes(2); // タグ削除 + ギャラリー画像削除
		expect(mockDb.insert).toHaveBeenCalledTimes(3); // 日本語翻訳のUpsert + 英語翻訳のUpsert + タグ追加
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
			GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
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
			GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
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

			// insert関数のモック（タグ追加用、Upsertサポート）
			mockDb.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue({}),
				}),
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

			// 改善後の検証: UPDATEは1回（記事のみ）、翻訳はINSERTでUpsert
			expect(mockDb.update).toHaveBeenCalledTimes(1);
			expect(mockDb.insert).toHaveBeenCalledTimes(3); // タグ追加 + 日本語翻訳 + 英語翻訳

			// 翻訳サービスが呼ばれたことを確認
			expect(mockTranslateArticle).toHaveBeenCalledWith(
				"更新された記事",
				"これは更新された内容です。"
			);
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

			// insert関数のモック（タグ追加用、Upsertサポート）
			mockDb.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue({}),
				}),
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
			// UPDATEは1回（記事のみ）、日本語翻訳はINSERTでUpsert、英語翻訳は失敗したのでスキップ
			expect(mockDb.update).toHaveBeenCalledTimes(1);
			expect(mockDb.insert).toHaveBeenCalledTimes(2); // タグ追加 + 日本語翻訳
		});

		describe("H1見出しバリデーション", () => {
			describe("エラーになるケース", () => {
				it("行頭にH1見出しがある場合、400エラーを返す", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-h1-beginning",
							content: "# H1見出し\n\n本文があります。",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(400);
					expect(mockDb.update).not.toHaveBeenCalled();
				});

				it("文章途中の改行後にH1見出しがある場合、400エラーを返す", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-h1-middle",
							content: "本文があります。\n\n# H1見出し\n\n続きの本文。",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(400);
					expect(mockDb.update).not.toHaveBeenCalled();
				});

				it("スペースが複数あるH1見出しの場合、400エラーを返す", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-h1-multiple-spaces",
							content: "#  H1見出し（スペース2つ）",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(400);
					expect(mockDb.update).not.toHaveBeenCalled();
				});

				it("複数のH1見出しがある場合、400エラーを返す", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-multiple-h1",
							content: "# H1見出し1\n\n本文\n\n# H1見出し2",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(400);
					expect(mockDb.update).not.toHaveBeenCalled();
				});
			});

			describe("エラーにならないケース", () => {
				it("H2以降の見出しは許可される", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					// 既存記事のモック
					const existingArticleMock = {
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([
									{
										id: 1,
										slug: "test-article-h2",
										cfImageId: null,
										status: "draft",
									},
								]),
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
											slug: "test-article-h2",
											cfImageId: null,
											status: "draft",
											publishedAt: null,
											updatedAt: "2024-01-02T00:00:00.000Z",
											title: "テスト記事",
											content: "## H2見出し\n### H3見出し\n#### H4見出し",
											viewCount: 0,
										},
									]),
								}),
							}),
						}),
					};

					// スラッグが変わっていないので、重複チェックはスキップされる
					// したがって、selectは2回だけ呼ばれる（既存記事チェック、更新後の記事取得）
					mockDb.select
						.mockReturnValueOnce(existingArticleMock)
						.mockReturnValueOnce(updatedArticleMock);

					mockDb.update = vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue({}),
						}),
					});

					mockDb.delete = vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue({}),
					});

					mockDb.insert = vi.fn().mockReturnValue({
						values: vi.fn().mockReturnValue({
							onConflictDoUpdate: vi.fn().mockResolvedValue({}),
						}),
					});

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-h2",
							content: "## H2見出し\n### H3見出し\n#### H4見出し",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(200);
				});

				it("コードブロック内のH1は無視される", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					const existingArticleMock = {
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([
									{
										id: 1,
										slug: "test-article-code-block",
										cfImageId: null,
										status: "draft",
									},
								]),
							}),
						}),
					};

					const updatedArticleMock = {
						from: vi.fn().mockReturnValue({
							leftJoin: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									limit: vi.fn().mockResolvedValue([
										{
											id: 1,
											slug: "test-article-code-block",
											cfImageId: null,
											status: "draft",
											publishedAt: null,
											updatedAt: "2024-01-02T00:00:00.000Z",
											title: "テスト記事",
											content: "```bash\n# これはコメント\n```",
											viewCount: 0,
										},
									]),
								}),
							}),
						}),
					};

					// スラッグが変わっていないので、重複チェックはスキップされる
					mockDb.select
						.mockReturnValueOnce(existingArticleMock)
						.mockReturnValueOnce(updatedArticleMock);

					mockDb.update = vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue({}),
						}),
					});

					mockDb.delete = vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue({}),
					});

					mockDb.insert = vi.fn().mockReturnValue({
						values: vi.fn().mockReturnValue({
							onConflictDoUpdate: vi.fn().mockResolvedValue({}),
						}),
					});

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-code-block",
							content: "```bash\n# これはコメント\n```",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(200);
				});

				it("行頭でない#は許可される", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					const existingArticleMock = {
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([
									{
										id: 1,
										slug: "test-article-inline-hash",
										cfImageId: null,
										status: "draft",
									},
								]),
							}),
						}),
					};

					const updatedArticleMock = {
						from: vi.fn().mockReturnValue({
							leftJoin: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									limit: vi.fn().mockResolvedValue([
										{
											id: 1,
											slug: "test-article-inline-hash",
											cfImageId: null,
											status: "draft",
											publishedAt: null,
											updatedAt: "2024-01-02T00:00:00.000Z",
											title: "テスト記事",
											content: "text # ハッシュタグ",
											viewCount: 0,
										},
									]),
								}),
							}),
						}),
					};

					// スラッグが変わっていないので、重複チェックはスキップされる
					mockDb.select
						.mockReturnValueOnce(existingArticleMock)
						.mockReturnValueOnce(updatedArticleMock);

					mockDb.update = vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue({}),
						}),
					});

					mockDb.delete = vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue({}),
					});

					mockDb.insert = vi.fn().mockReturnValue({
						values: vi.fn().mockReturnValue({
							onConflictDoUpdate: vi.fn().mockResolvedValue({}),
						}),
					});

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-inline-hash",
							content: "text # ハッシュタグ",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(200);
				});

				it("スペースなしの#は許可される", async () => {
					// Arrange
					const { mockDb } = setupDbMocks();
					const { createDatabaseClient } = await import("@saneatsu/db");
					(createDatabaseClient as any).mockReturnValue(mockDb);

					const existingArticleMock = {
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([
									{
										id: 1,
										slug: "test-article-no-space-hash",
										cfImageId: null,
										status: "draft",
									},
								]),
							}),
						}),
					};

					const updatedArticleMock = {
						from: vi.fn().mockReturnValue({
							leftJoin: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									limit: vi.fn().mockResolvedValue([
										{
											id: 1,
											slug: "test-article-no-space-hash",
											cfImageId: null,
											status: "draft",
											publishedAt: null,
											updatedAt: "2024-01-02T00:00:00.000Z",
											title: "テスト記事",
											content: "#text",
											viewCount: 0,
										},
									]),
								}),
							}),
						}),
					};

					// スラッグが変わっていないので、重複チェックはスキップされる
					mockDb.select
						.mockReturnValueOnce(existingArticleMock)
						.mockReturnValueOnce(updatedArticleMock);

					mockDb.update = vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue({}),
						}),
					});

					mockDb.delete = vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue({}),
					});

					mockDb.insert = vi.fn().mockReturnValue({
						values: vi.fn().mockReturnValue({
							onConflictDoUpdate: vi.fn().mockResolvedValue({}),
						}),
					});

					// Act
					const client = testClient(articlesRoute, {
						TURSO_DATABASE_URL: "test://test.db",
						TURSO_AUTH_TOKEN: "test-token",
						GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
					}) as any;
					const res = await client[":id"].$put({
						param: { id: "1" },
						json: {
							title: "テスト記事",
							slug: "test-article-no-space-hash",
							content: "#text",
							status: "draft",
						},
					});

					// Assert
					expect(res.status).toBe(200);
				});
			});
		});
	});

	describe("翻訳機能のスキップ", () => {
		it("下書きとして更新した場合、翻訳が実行されないこと", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockClear();

			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			const selectDuplicateMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue({}),
				}),
			};

			const upsertMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue({}),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			const selectFinalMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "draft-article",
									cfImageId: null,
									status: "draft",
									publishedAt: null,
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "下書き記事",
									content: "下書きコンテンツ",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock)
				.mockReturnValueOnce(selectDuplicateMock)
				.mockReturnValueOnce(selectFinalMock);
			mockDb.update.mockReturnValueOnce(updateMock);
			mockDb.insert.mockReturnValueOnce(upsertMock);
			mockDb.delete
				.mockReturnValueOnce(deleteMock) // タグ削除
				.mockReturnValueOnce(deleteMock); // ギャラリー画像削除

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "下書き記事",
					slug: "draft-article",
					content: "下書きコンテンツ",
					status: "draft",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			expect(mockTranslateArticle).not.toHaveBeenCalled();
		});

		it("公開記事として更新した場合、翻訳が実行されること", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockClear();
			mockTranslateArticle.mockResolvedValueOnce({
				title: "Published Article",
				content: "Published content",
			});

			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			const selectDuplicateMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue({}),
				}),
			};

			const upsertJaMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue({}),
				}),
			};

			const upsertEnMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue({}),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			const selectFinalMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "published-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-02T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "公開記事",
									content: "公開コンテンツ",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock)
				.mockReturnValueOnce(selectDuplicateMock)
				.mockReturnValueOnce(selectFinalMock);
			mockDb.update.mockReturnValueOnce(updateMock);
			mockDb.insert
				.mockReturnValueOnce(upsertJaMock)
				.mockReturnValueOnce(upsertEnMock);
			mockDb.delete
				.mockReturnValueOnce(deleteMock) // タグ削除
				.mockReturnValueOnce(deleteMock); // ギャラリー画像削除

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "公開記事",
					slug: "published-article",
					content: "公開コンテンツ",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			expect(mockTranslateArticle).toHaveBeenCalledWith(
				"公開記事",
				"公開コンテンツ"
			);
		});
	});

	describe("Integration Test - Gallery Image Auto-Extraction", () => {
		it("should auto-extract gallery images from content and associate them", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// 翻訳サービスのモック設定
			mockTranslateArticle.mockResolvedValue({
				title: "Test Article",
				content: "Test content",
			});

			// 既存記事チェックのモック
			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			// スラッグ重複チェックのモック（重複なし）
			const _duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// ギャラリー画像のcfImageIdからID取得のモック
			const galleryImagesMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([
						{ id: 101 }, // gallery-image-1
						{ id: 102 }, // gallery-image-2
					]),
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
									slug: "test-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "テスト記事",
									content:
										"![Image 1](https://imagedelivery.net/xxx/gallery-image-1/original)\n![Image 2](https://imagedelivery.net/xxx/gallery-image-2/large)",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
				.mockReturnValueOnce(galleryImagesMock) // ギャラリー画像取得
				.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertJaMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertEnMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue(undefined),
			};

			const insertMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.update.mockReturnValue(updateMock);
			mockDb.insert
				.mockReturnValueOnce(upsertJaMock) // 日本語翻訳Upsert
				.mockReturnValueOnce(upsertEnMock) // 英語翻訳Upsert
				.mockReturnValueOnce(insertMock); // ギャラリー画像挿入

			mockDb.delete
				.mockReturnValueOnce(deleteMock) // タグ削除
				.mockReturnValueOnce(deleteMock); // ギャラリー画像削除

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "テスト記事",
					slug: "test-article",
					content:
						"![Image 1](https://imagedelivery.net/xxx/gallery-image-1/original)\n![Image 2](https://imagedelivery.net/xxx/gallery-image-2/large)",
					status: "published",
					// galleryImageIds は指定しない（自動抽出のみ）
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// ギャラリー画像の挿入が呼ばれたことを確認
			expect(mockDb.insert).toHaveBeenCalledTimes(3); // 日本語翻訳 + 英語翻訳 + ギャラリー画像
			// 最後の insert 呼び出しがギャラリー画像の挿入
			const galleryImageInsertCall = mockDb.insert.mock.calls[2];
			expect(galleryImageInsertCall[0]).toEqual({}); // articleGalleryImages テーブル

			// values が正しく呼ばれたことを確認
			const valuesCall = insertMock.values.mock.calls[0];
			expect(valuesCall[0]).toEqual([
				{ articleId: 1, galleryImageId: 101 },
				{ articleId: 1, galleryImageId: 102 },
			]);
		});

		it("should handle both manual galleryImageIds and auto-extracted images", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockResolvedValue({
				title: "Test Article",
				content: "Test content",
			});

			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			const _duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const galleryImagesMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([
						{ id: 103 }, // gallery-image-3
						{ id: 104 }, // gallery-image-4
					]),
				}),
			};

			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "test-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "テスト記事",
									content:
										"![Image 3](https://imagedelivery.net/xxx/gallery-image-3/original)\n![Image 4](https://imagedelivery.net/xxx/gallery-image-4/large)",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(updatedArticleMock);

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertJaMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertEnMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue(undefined),
			};

			const insertMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.update.mockReturnValue(updateMock);
			mockDb.insert
				.mockReturnValueOnce(upsertJaMock)
				.mockReturnValueOnce(upsertEnMock)
				.mockReturnValueOnce(insertMock);

			mockDb.delete
				.mockReturnValueOnce(deleteMock)
				.mockReturnValueOnce(deleteMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "テスト記事",
					slug: "test-article",
					content:
						"![Image 3](https://imagedelivery.net/xxx/gallery-image-3/original)\n![Image 4](https://imagedelivery.net/xxx/gallery-image-4/large)",
					status: "published",
					galleryImageIds: [1, 2], // 手動指定
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// values が手動指定(1,2) + 自動抽出(103,104) の4つを含むことを確認
			const valuesCall = insertMock.values.mock.calls[0];
			expect(valuesCall[0]).toHaveLength(4);
			expect(valuesCall[0]).toContainEqual({ articleId: 1, galleryImageId: 1 });
			expect(valuesCall[0]).toContainEqual({ articleId: 1, galleryImageId: 2 });
			expect(valuesCall[0]).toContainEqual({
				articleId: 1,
				galleryImageId: 103,
			});
			expect(valuesCall[0]).toContainEqual({
				articleId: 1,
				galleryImageId: 104,
			});
		});

		it("should remove duplicate gallery image IDs", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockResolvedValue({
				title: "Test Article",
				content: "Test content",
			});

			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			const _duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// コンテンツには gallery-image-1 が含まれている
			const galleryImagesMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([
						{ id: 1 }, // gallery-image-1 (手動指定と同じ)
					]),
				}),
			};

			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "test-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "テスト記事",
									content:
										"![Image 1](https://imagedelivery.net/xxx/gallery-image-1/original)",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(updatedArticleMock);

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertJaMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertEnMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue(undefined),
			};

			const insertMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.update.mockReturnValue(updateMock);
			mockDb.insert
				.mockReturnValueOnce(upsertJaMock)
				.mockReturnValueOnce(upsertEnMock)
				.mockReturnValueOnce(insertMock);

			mockDb.delete
				.mockReturnValueOnce(deleteMock)
				.mockReturnValueOnce(deleteMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "テスト記事",
					slug: "test-article",
					content:
						"![Image 1](https://imagedelivery.net/xxx/gallery-image-1/original)",
					status: "published",
					galleryImageIds: [1], // 手動指定（コンテンツと重複）
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// 重複が除去されて、1つだけ挿入されることを確認
			const valuesCall = insertMock.values.mock.calls[0];
			expect(valuesCall[0]).toHaveLength(1);
			expect(valuesCall[0]).toEqual([{ articleId: 1, galleryImageId: 1 }]);
		});

		it("should ignore content- prefixed images", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockResolvedValue({
				title: "Test Article",
				content: "Test content",
			});

			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			const _duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// gallery-image-1 のみ取得（content-image-1 は除外）
			const galleryImagesMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([
						{ id: 1 }, // gallery-image-1
					]),
				}),
			};

			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "test-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "テスト記事",
									content:
										"![Content](https://imagedelivery.net/xxx/content-image-1/original)\n![Gallery](https://imagedelivery.net/xxx/gallery-image-1/large)",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(updatedArticleMock);

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertJaMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertEnMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue(undefined),
			};

			const insertMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.update.mockReturnValue(updateMock);
			mockDb.insert
				.mockReturnValueOnce(upsertJaMock)
				.mockReturnValueOnce(upsertEnMock)
				.mockReturnValueOnce(insertMock);

			mockDb.delete
				.mockReturnValueOnce(deleteMock)
				.mockReturnValueOnce(deleteMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "テスト記事",
					slug: "test-article",
					content:
						"![Content](https://imagedelivery.net/xxx/content-image-1/original)\n![Gallery](https://imagedelivery.net/xxx/gallery-image-1/large)",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// gallery-image-1 のみ挿入されることを確認
			const valuesCall = insertMock.values.mock.calls[0];
			expect(valuesCall[0]).toEqual([{ articleId: 1, galleryImageId: 1 }]);
		});

		it("should handle non-existent cfImageIds gracefully", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockResolvedValue({
				title: "Test Article",
				content: "Test content",
			});

			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			const _duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// 存在しない cfImageId なので空配列を返す
			const galleryImagesMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "test-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "テスト記事",
									content:
										"![Nonexistent](https://imagedelivery.net/xxx/gallery-nonexistent/original)",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(updatedArticleMock);

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertJaMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertEnMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.update.mockReturnValue(updateMock);
			mockDb.insert
				.mockReturnValueOnce(upsertJaMock)
				.mockReturnValueOnce(upsertEnMock);
			// ギャラリー画像挿入は呼ばれない（空配列のため）

			mockDb.delete
				.mockReturnValueOnce(deleteMock)
				.mockReturnValueOnce(deleteMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "テスト記事",
					slug: "test-article",
					content:
						"![Nonexistent](https://imagedelivery.net/xxx/gallery-nonexistent/original)",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// ギャラリー画像挿入は呼ばれない
			expect(mockDb.insert).toHaveBeenCalledTimes(2); // 日本語翻訳 + 英語翻訳のみ
		});

		it("should work when content has no image URLs", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockResolvedValue({
				title: "Test Article",
				content: "Test content",
			});

			const existingArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-article" }]),
					}),
				}),
			};

			const _duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const updatedArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "test-article",
									cfImageId: null,
									status: "published",
									publishedAt: "2024-01-01T00:00:00.000Z",
									updatedAt: "2024-01-02T00:00:00.000Z",
									title: "テスト記事",
									content: "これはテキストだけの記事です。",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingArticleMock)
				.mockReturnValueOnce(updatedArticleMock);

			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertJaMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const upsertEnMock = {
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
				}),
			};

			const deleteMock = {
				where: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.update.mockReturnValue(updateMock);
			mockDb.insert
				.mockReturnValueOnce(upsertJaMock)
				.mockReturnValueOnce(upsertEnMock);
			// ギャラリー画像挿入は呼ばれない（画像URLがないため）

			mockDb.delete
				.mockReturnValueOnce(deleteMock)
				.mockReturnValueOnce(deleteMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					title: "テスト記事",
					slug: "test-article",
					content: "これはテキストだけの記事です。",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(200);

			// ギャラリー画像挿入は呼ばれない
			expect(mockDb.insert).toHaveBeenCalledTimes(2); // 日本語翻訳 + 英語翻訳のみ
		});
	});
});
