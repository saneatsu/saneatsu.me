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

describe("POST /articles - 記事作成", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事を正常に作成する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockNewArticle = {
			id: 1,
			slug: "new-article",
			status: "draft",
			cfImageId: null,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
			publishedAt: null,
		};

		const mockTranslation = {
			id: 1,
			articleId: 1,
			language: "ja",
			title: "新しい記事",
			content: "# 新しい記事\n\nこれは新しい記事の内容です。",
			viewCount: 0,
		};

		const mockCreatedArticle = {
			...mockNewArticle,
			title: mockTranslation.title,
			content: mockTranslation.content,
			viewCount: mockTranslation.viewCount,
		};

		// Insert記事のモック
		const insertArticleMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockNewArticle]),
			}),
		};

		// Insert翻訳のモック
		const insertTranslationMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockTranslation]),
			}),
		};

		// Insert記事タグのモック
		const _insertArticleTagMock = {
			values: vi.fn().mockResolvedValue({}),
		};

		// Select記事のモック（作成後の記事取得用）
		const selectArticleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
					}),
				}),
			}),
		};

		// Selectタグのモック
		const selectTagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{ id: 1, slug: "javascript", name: "JavaScript" },
							{ id: 2, slug: "web-development", name: "Web開発" },
						]),
					}),
				}),
			}),
		};

		// 既存記事チェック用のモック
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 既存記事なし
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(checkExistingMock) // 既存記事チェック
			.mockReturnValueOnce(selectArticleMock) // 記事取得
			.mockReturnValueOnce(selectTagsMock); // タグ取得

		// タグ関連付け用のモック
		const insertTagAssociationMock = {
			values: vi.fn().mockResolvedValue([
				{ articleId: 1, tagId: 1 },
				{ articleId: 1, tagId: 2 },
			]),
		};

		mockDb.insert
			.mockReturnValueOnce(insertArticleMock) // 記事作成
			.mockReturnValueOnce(insertTranslationMock) // 翻訳作成
			.mockReturnValueOnce(insertTagAssociationMock); // タグ関連付け

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				title: "新しい記事",
				slug: "new-article",
				content: "## 新しい記事\n\nこれは新しい記事の内容です。",
				status: "draft",
				tagIds: [1, 2],
			},
		});

		// Assert
		expect(res.status).toBe(201);
		const data = await res.json();

		expect(data).toEqual({
			data: mockCreatedArticle,
			message: "記事が正常に作成されました",
		});

		expect(mockDb.insert).toHaveBeenCalledTimes(3); // 記事、翻訳、タグ関連
		expect(mockDb.select).toHaveBeenCalledTimes(2); // 既存チェック、記事取得
	});

	it("サムネイル画像付きで記事を正常に作成する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const testImageId = "test-image-id-123";

		const mockNewArticle = {
			id: 1,
			slug: "article-with-thumbnail",
			status: "draft",
			cfImageId: testImageId, // サムネイル画像ID
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
			publishedAt: null,
		};

		const mockTranslation = {
			id: 1,
			articleId: 1,
			language: "ja",
			title: "サムネイル付き記事",
			content:
				"## サムネイル付き記事\n\nこの記事にはサムネイル画像があります。",
			viewCount: 0,
		};

		const mockCreatedArticle = {
			...mockNewArticle,
			title: mockTranslation.title,
			content: mockTranslation.content,
			viewCount: mockTranslation.viewCount,
		};

		// Insert記事のモック
		const insertArticleMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockNewArticle]),
			}),
		};

		// Insert翻訳のモック
		const insertTranslationMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockTranslation]),
			}),
		};

		// Select記事のモック（作成後の記事取得用）
		const selectArticleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
					}),
				}),
			}),
		};

		// 既存記事チェック用のモック
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 既存記事なし
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(checkExistingMock) // 既存記事チェック
			.mockReturnValueOnce(selectArticleMock); // 記事取得

		mockDb.insert
			.mockReturnValueOnce(insertArticleMock) // 記事作成
			.mockReturnValueOnce(insertTranslationMock); // 翻訳作成

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				title: "サムネイル付き記事",
				slug: "article-with-thumbnail",
				content:
					"## サムネイル付き記事\n\nこの記事にはサムネイル画像があります。",
				status: "draft",
				cfImageId: testImageId, // サムネイル画像IDを含む
			},
		});

		// Assert
		expect(res.status).toBe(201);
		const data = await res.json();

		expect(data).toEqual({
			data: mockCreatedArticle,
			message: "記事が正常に作成されました",
		});

		// cfImageIdが正しく保存されたことを確認
		expect(insertArticleMock.values).toHaveBeenCalledWith(
			expect.objectContaining({
				cfImageId: testImageId,
			})
		);

		expect(mockDb.insert).toHaveBeenCalledTimes(2); // 記事、翻訳
		expect(mockDb.select).toHaveBeenCalledTimes(2); // 既存チェック、記事取得
	});

	it("バリデーションエラー: タイトルが空の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				title: "",
				slug: "empty-title-article",
				content: "内容があります",
				status: "draft",
				tagIds: [1],
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});

	it("バリデーションエラー: スラッグが不正な形式の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				title: "正常なタイトル",
				slug: "Invalid Slug With Spaces!",
				content: "内容があります",
				status: "draft",
				tagIds: [1],
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
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
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-h1-beginning",
						content: "# H1見出し\n\n本文があります。",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(400);
				expect(mockDb.insert).not.toHaveBeenCalled();
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
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-h1-middle",
						content: "本文があります。\n\n# H1見出し\n\n続きの本文。",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(400);
				expect(mockDb.insert).not.toHaveBeenCalled();
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
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-h1-multiple-spaces",
						content: "#  H1見出し（スペース2つ）",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(400);
				expect(mockDb.insert).not.toHaveBeenCalled();
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
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-multiple-h1",
						content: "# H1見出し1\n\n本文\n\n# H1見出し2",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(400);
				expect(mockDb.insert).not.toHaveBeenCalled();
			});
		});

		describe("エラーにならないケース", () => {
			it("H2以降の見出しは許可される", async () => {
				// Arrange
				const { mockDb } = setupDbMocks();
				const { createDatabaseClient } = await import("@saneatsu/db");
				(createDatabaseClient as any).mockReturnValue(mockDb);

				const mockNewArticle = {
					id: 1,
					slug: "test-article-h2",
					status: "draft",
					cfImageId: null,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					publishedAt: null,
				};

				const mockTranslation = {
					id: 1,
					articleId: 1,
					language: "ja",
					title: "テスト記事",
					content: "## H2見出し\n### H3見出し\n#### H4見出し",
					viewCount: 0,
				};

				const mockCreatedArticle = {
					...mockNewArticle,
					title: mockTranslation.title,
					content: mockTranslation.content,
					viewCount: mockTranslation.viewCount,
					tags: [],
				};

				const insertArticleMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockNewArticle]),
					}),
				};

				const insertTranslationMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockTranslation]),
					}),
				};

				const selectArticleMock = {
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
							}),
						}),
					}),
				};

				const checkExistingMock = {
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				};

				mockDb.select
					.mockReturnValueOnce(checkExistingMock)
					.mockReturnValueOnce(selectArticleMock);

				mockDb.insert
					.mockReturnValueOnce(insertArticleMock)
					.mockReturnValueOnce(insertTranslationMock);

				// Act
				const client = testClient(articlesRoute, {
					TURSO_DATABASE_URL: "test://test.db",
					TURSO_AUTH_TOKEN: "test-token",
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-h2",
						content: "## H2見出し\n### H3見出し\n#### H4見出し",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(201);
			});

			it("コードブロック内のH1は無視される", async () => {
				// Arrange
				const { mockDb } = setupDbMocks();
				const { createDatabaseClient } = await import("@saneatsu/db");
				(createDatabaseClient as any).mockReturnValue(mockDb);

				const mockNewArticle = {
					id: 1,
					slug: "test-article-code-block",
					status: "draft",
					cfImageId: null,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					publishedAt: null,
				};

				const mockTranslation = {
					id: 1,
					articleId: 1,
					language: "ja",
					title: "テスト記事",
					content: "```bash\n# これはコメント\n```",
					viewCount: 0,
				};

				const mockCreatedArticle = {
					...mockNewArticle,
					title: mockTranslation.title,
					content: mockTranslation.content,
					viewCount: mockTranslation.viewCount,
					tags: [],
				};

				const insertArticleMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockNewArticle]),
					}),
				};

				const insertTranslationMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockTranslation]),
					}),
				};

				const selectArticleMock = {
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
							}),
						}),
					}),
				};

				const checkExistingMock = {
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				};

				mockDb.select
					.mockReturnValueOnce(checkExistingMock)
					.mockReturnValueOnce(selectArticleMock);

				mockDb.insert
					.mockReturnValueOnce(insertArticleMock)
					.mockReturnValueOnce(insertTranslationMock);

				// Act
				const client = testClient(articlesRoute, {
					TURSO_DATABASE_URL: "test://test.db",
					TURSO_AUTH_TOKEN: "test-token",
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-code-block",
						content: "```bash\n# これはコメント\n```",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(201);
			});

			it("行頭でない#は許可される", async () => {
				// Arrange
				const { mockDb } = setupDbMocks();
				const { createDatabaseClient } = await import("@saneatsu/db");
				(createDatabaseClient as any).mockReturnValue(mockDb);

				const mockNewArticle = {
					id: 1,
					slug: "test-article-inline-hash",
					status: "draft",
					cfImageId: null,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					publishedAt: null,
				};

				const mockTranslation = {
					id: 1,
					articleId: 1,
					language: "ja",
					title: "テスト記事",
					content: "text # ハッシュタグ",
					viewCount: 0,
				};

				const mockCreatedArticle = {
					...mockNewArticle,
					title: mockTranslation.title,
					content: mockTranslation.content,
					viewCount: mockTranslation.viewCount,
					tags: [],
				};

				const insertArticleMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockNewArticle]),
					}),
				};

				const insertTranslationMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockTranslation]),
					}),
				};

				const selectArticleMock = {
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
							}),
						}),
					}),
				};

				const checkExistingMock = {
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				};

				mockDb.select
					.mockReturnValueOnce(checkExistingMock)
					.mockReturnValueOnce(selectArticleMock);

				mockDb.insert
					.mockReturnValueOnce(insertArticleMock)
					.mockReturnValueOnce(insertTranslationMock);

				// Act
				const client = testClient(articlesRoute, {
					TURSO_DATABASE_URL: "test://test.db",
					TURSO_AUTH_TOKEN: "test-token",
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-inline-hash",
						content: "text # ハッシュタグ",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(201);
			});

			it("スペースなしの#は許可される", async () => {
				// Arrange
				const { mockDb } = setupDbMocks();
				const { createDatabaseClient } = await import("@saneatsu/db");
				(createDatabaseClient as any).mockReturnValue(mockDb);

				const mockNewArticle = {
					id: 1,
					slug: "test-article-no-space-hash",
					status: "draft",
					cfImageId: null,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					publishedAt: null,
				};

				const mockTranslation = {
					id: 1,
					articleId: 1,
					language: "ja",
					title: "テスト記事",
					content: "#text",
					viewCount: 0,
				};

				const mockCreatedArticle = {
					...mockNewArticle,
					title: mockTranslation.title,
					content: mockTranslation.content,
					viewCount: mockTranslation.viewCount,
					tags: [],
				};

				const insertArticleMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockNewArticle]),
					}),
				};

				const insertTranslationMock = {
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockTranslation]),
					}),
				};

				const selectArticleMock = {
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
							}),
						}),
					}),
				};

				const checkExistingMock = {
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				};

				mockDb.select
					.mockReturnValueOnce(checkExistingMock)
					.mockReturnValueOnce(selectArticleMock);

				mockDb.insert
					.mockReturnValueOnce(insertArticleMock)
					.mockReturnValueOnce(insertTranslationMock);

				// Act
				const client = testClient(articlesRoute, {
					TURSO_DATABASE_URL: "test://test.db",
					TURSO_AUTH_TOKEN: "test-token",
				}) as any;
				const res = await client.index.$post({
					json: {
						title: "テスト記事",
						slug: "test-article-no-space-hash",
						content: "#text",
						status: "draft",
					},
				});

				// Assert
				expect(res.status).toBe(201);
			});
		});
	});

	describe("翻訳機能", () => {
		it("下書きとして作成した場合、翻訳が実行されないこと", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockClear();

			const mockNewArticle = {
				id: 1,
				slug: "draft-article",
				status: "draft",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: null,
			};

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationMock = {
				values: vi.fn().mockResolvedValue({}),
			};

			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									...mockNewArticle,
									title: "下書き記事",
									content: "下書きコンテンツ",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			});
			mockDb.insert.mockReturnValueOnce(insertArticleMock);
			mockDb.insert.mockReturnValueOnce(insertTranslationMock);
			mockDb.select.mockReturnValueOnce(selectArticleMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
				json: {
					title: "下書き記事",
					slug: "draft-article",
					content: "下書きコンテンツ",
					status: "draft",
				},
			});

			// Assert
			expect(res.status).toBe(201);
			expect(mockTranslateArticle).not.toHaveBeenCalled();
		});

		it("公開記事として作成した場合、翻訳が実行されること", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();
			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockTranslateArticle.mockClear();
			mockTranslateArticle.mockResolvedValueOnce({
				title: "Published Article",
				content: "Published content",
			});

			const mockNewArticle = {
				id: 1,
				slug: "published-article",
				status: "published",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: "2024-01-01T00:00:00.000Z",
			};

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationMock = {
				values: vi.fn().mockResolvedValue({}),
			};

			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									...mockNewArticle,
									title: "公開記事",
									content: "公開コンテンツ",
									viewCount: 0,
								},
							]),
						}),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			});
			mockDb.insert.mockReturnValueOnce(insertArticleMock);
			mockDb.insert.mockReturnValueOnce(insertTranslationMock);
			mockDb.insert.mockReturnValueOnce(insertTranslationMock);
			mockDb.select.mockReturnValueOnce(selectArticleMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
				json: {
					title: "公開記事",
					slug: "published-article",
					content: "公開コンテンツ",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(201);
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

			const mockNewArticle = {
				id: 1,
				slug: "test-article",
				status: "published",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockTranslationJa = {
				id: 1,
				articleId: 1,
				language: "ja",
				title: "テスト記事",
				content:
					"![Image 1](https://imagedelivery.net/xxx/gallery-image-1/original)\n![Image 2](https://imagedelivery.net/xxx/gallery-image-2/large)",
				viewCount: 0,
			};

			const mockCreatedArticle = {
				...mockNewArticle,
				title: mockTranslationJa.title,
				content: mockTranslationJa.content,
				viewCount: mockTranslationJa.viewCount,
			};

			// スラッグ重複チェックのモック（重複なし）
			const duplicateSlugMock = {
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

			// 作成後の記事取得のモック
			const createdArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(duplicateSlugMock) // スラッグ重複チェック
				.mockReturnValueOnce(galleryImagesMock) // ギャラリー画像取得
				.mockReturnValueOnce(createdArticleMock); // 作成後の記事取得

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationJaMock = {
				values: vi.fn().mockResolvedValue([mockTranslationJa]),
			};

			const insertTranslationEnMock = {
				values: vi.fn().mockResolvedValue([]),
			};

			const insertGalleryImagesMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.insert
				.mockReturnValueOnce(insertArticleMock) // 記事作成
				.mockReturnValueOnce(insertTranslationJaMock) // 日本語翻訳
				.mockReturnValueOnce(insertTranslationEnMock) // 英語翻訳
				.mockReturnValueOnce(insertGalleryImagesMock); // ギャラリー画像挿入

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
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
			expect(res.status).toBe(201);

			// ギャラリー画像の挿入が呼ばれたことを確認
			expect(mockDb.insert).toHaveBeenCalledTimes(4); // 記事 + 日本語翻訳 + 英語翻訳 + ギャラリー画像
			// 最後の insert 呼び出しがギャラリー画像の挿入
			const galleryImageInsertCall = mockDb.insert.mock.calls[3];
			expect(galleryImageInsertCall[0]).toEqual({}); // articleGalleryImages テーブル

			// values が正しく呼ばれたことを確認
			const valuesCall = insertGalleryImagesMock.values.mock.calls[0];
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

			const mockNewArticle = {
				id: 1,
				slug: "test-article",
				status: "published",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockTranslationJa = {
				id: 1,
				articleId: 1,
				language: "ja",
				title: "テスト記事",
				content:
					"![Image 3](https://imagedelivery.net/xxx/gallery-image-3/original)\n![Image 4](https://imagedelivery.net/xxx/gallery-image-4/large)",
				viewCount: 0,
			};

			const mockCreatedArticle = {
				...mockNewArticle,
				title: mockTranslationJa.title,
				content: mockTranslationJa.content,
				viewCount: mockTranslationJa.viewCount,
			};

			const duplicateSlugMock = {
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

			const createdArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(duplicateSlugMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(createdArticleMock);

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationJaMock = {
				values: vi.fn().mockResolvedValue([mockTranslationJa]),
			};

			const insertTranslationEnMock = {
				values: vi.fn().mockResolvedValue([]),
			};

			const insertGalleryImagesMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.insert
				.mockReturnValueOnce(insertArticleMock)
				.mockReturnValueOnce(insertTranslationJaMock)
				.mockReturnValueOnce(insertTranslationEnMock)
				.mockReturnValueOnce(insertGalleryImagesMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
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
			expect(res.status).toBe(201);

			// values が手動指定(1,2) + 自動抽出(103,104) の4つを含むことを確認
			const valuesCall = insertGalleryImagesMock.values.mock.calls[0];
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

			const mockNewArticle = {
				id: 1,
				slug: "test-article",
				status: "published",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockTranslationJa = {
				id: 1,
				articleId: 1,
				language: "ja",
				title: "テスト記事",
				content:
					"![Image 1](https://imagedelivery.net/xxx/gallery-image-1/original)",
				viewCount: 0,
			};

			const mockCreatedArticle = {
				...mockNewArticle,
				title: mockTranslationJa.title,
				content: mockTranslationJa.content,
				viewCount: mockTranslationJa.viewCount,
			};

			const duplicateSlugMock = {
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

			const createdArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(duplicateSlugMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(createdArticleMock);

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationJaMock = {
				values: vi.fn().mockResolvedValue([mockTranslationJa]),
			};

			const insertTranslationEnMock = {
				values: vi.fn().mockResolvedValue([]),
			};

			const insertGalleryImagesMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.insert
				.mockReturnValueOnce(insertArticleMock)
				.mockReturnValueOnce(insertTranslationJaMock)
				.mockReturnValueOnce(insertTranslationEnMock)
				.mockReturnValueOnce(insertGalleryImagesMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
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
			expect(res.status).toBe(201);

			// 重複が除去されて、1つだけ挿入されることを確認
			const valuesCall = insertGalleryImagesMock.values.mock.calls[0];
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

			const mockNewArticle = {
				id: 1,
				slug: "test-article",
				status: "published",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockTranslationJa = {
				id: 1,
				articleId: 1,
				language: "ja",
				title: "テスト記事",
				content:
					"![Content](https://imagedelivery.net/xxx/content-image-1/original)\n![Gallery](https://imagedelivery.net/xxx/gallery-image-1/large)",
				viewCount: 0,
			};

			const mockCreatedArticle = {
				...mockNewArticle,
				title: mockTranslationJa.title,
				content: mockTranslationJa.content,
				viewCount: mockTranslationJa.viewCount,
			};

			const duplicateSlugMock = {
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

			const createdArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(duplicateSlugMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(createdArticleMock);

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationJaMock = {
				values: vi.fn().mockResolvedValue([mockTranslationJa]),
			};

			const insertTranslationEnMock = {
				values: vi.fn().mockResolvedValue([]),
			};

			const insertGalleryImagesMock = {
				values: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.insert
				.mockReturnValueOnce(insertArticleMock)
				.mockReturnValueOnce(insertTranslationJaMock)
				.mockReturnValueOnce(insertTranslationEnMock)
				.mockReturnValueOnce(insertGalleryImagesMock);

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
				json: {
					title: "テスト記事",
					slug: "test-article",
					content:
						"![Content](https://imagedelivery.net/xxx/content-image-1/original)\n![Gallery](https://imagedelivery.net/xxx/gallery-image-1/large)",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(201);

			// gallery-image-1 のみ挿入されることを確認
			const valuesCall = insertGalleryImagesMock.values.mock.calls[0];
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

			const mockNewArticle = {
				id: 1,
				slug: "test-article",
				status: "published",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockTranslationJa = {
				id: 1,
				articleId: 1,
				language: "ja",
				title: "テスト記事",
				content:
					"![Nonexistent](https://imagedelivery.net/xxx/gallery-nonexistent/original)",
				viewCount: 0,
			};

			const mockCreatedArticle = {
				...mockNewArticle,
				title: mockTranslationJa.title,
				content: mockTranslationJa.content,
				viewCount: mockTranslationJa.viewCount,
			};

			const duplicateSlugMock = {
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

			const createdArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(duplicateSlugMock)
				.mockReturnValueOnce(galleryImagesMock)
				.mockReturnValueOnce(createdArticleMock);

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationJaMock = {
				values: vi.fn().mockResolvedValue([mockTranslationJa]),
			};

			const insertTranslationEnMock = {
				values: vi.fn().mockResolvedValue([]),
			};

			mockDb.insert
				.mockReturnValueOnce(insertArticleMock)
				.mockReturnValueOnce(insertTranslationJaMock)
				.mockReturnValueOnce(insertTranslationEnMock);
			// ギャラリー画像挿入は呼ばれない（空配列のため）

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
				json: {
					title: "テスト記事",
					slug: "test-article",
					content:
						"![Nonexistent](https://imagedelivery.net/xxx/gallery-nonexistent/original)",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(201);

			// ギャラリー画像挿入は呼ばれない
			expect(mockDb.insert).toHaveBeenCalledTimes(3); // 記事 + 日本語翻訳 + 英語翻訳のみ
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

			const mockNewArticle = {
				id: 1,
				slug: "test-article",
				status: "published",
				cfImageId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				publishedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockTranslationJa = {
				id: 1,
				articleId: 1,
				language: "ja",
				title: "テスト記事",
				content: "これはテキストだけの記事です。",
				viewCount: 0,
			};

			const mockCreatedArticle = {
				...mockNewArticle,
				title: mockTranslationJa.title,
				content: mockTranslationJa.content,
				viewCount: mockTranslationJa.viewCount,
			};

			const duplicateSlugMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const createdArticleMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([mockCreatedArticle]),
						}),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(duplicateSlugMock)
				.mockReturnValueOnce(createdArticleMock);
			// ギャラリー画像取得は呼ばれない（画像URLがないため）

			const insertArticleMock = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockNewArticle]),
				}),
			};

			const insertTranslationJaMock = {
				values: vi.fn().mockResolvedValue([mockTranslationJa]),
			};

			const insertTranslationEnMock = {
				values: vi.fn().mockResolvedValue([]),
			};

			mockDb.insert
				.mockReturnValueOnce(insertArticleMock)
				.mockReturnValueOnce(insertTranslationJaMock)
				.mockReturnValueOnce(insertTranslationEnMock);
			// ギャラリー画像挿入は呼ばれない（画像URLがないため）

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client.index.$post({
				json: {
					title: "テスト記事",
					slug: "test-article",
					content: "これはテキストだけの記事です。",
					status: "published",
				},
			});

			// Assert
			expect(res.status).toBe(201);

			// ギャラリー画像挿入は呼ばれない
			expect(mockDb.insert).toHaveBeenCalledTimes(3); // 記事 + 日本語翻訳 + 英語翻訳のみ
		});
	});
});
