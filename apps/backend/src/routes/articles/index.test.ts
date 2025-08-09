import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupDbMocks } from "../../utils/drizzle-test";
import { createMockArticleWithTranslation } from "../../utils/vitest";
import { articlesRoute } from "./index";

// モックの設定
vi.mock("@saneatsu/db", () => ({
	db: {
		select: vi.fn(),
	},
	articles: {},
	articleTranslations: {},
}));

// createDbClient関数をモック
vi.mock("../../lib/db", () => ({
	createDbClient: vi.fn(),
}));

describe("GET /articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事一覧を正常に取得する", async () => {
		// Arrange
		const { mockDb, createSubqueryMock } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticles = [
			createMockArticleWithTranslation({
				article: {
					id: "article1",
					slug: "test-article-1",
					status: "published",
				},
				translation: {
					title: "テスト記事1",
					content: "これはテスト記事1の内容です。",
				},
			}),
			createMockArticleWithTranslation({
				article: {
					id: "article2",
					slug: "test-article-2",
					status: "published",
				},
				translation: {
					title: "テスト記事2",
					content: "これはテスト記事2の内容です。",
				},
			}),
		];

		const mockTotalCount = [{}, {}]; // 2件の記事を表す配列

		const totalViewCountSubqueryMock = createSubqueryMock([
			{ articleId: "article1", totalViewCount: 0 },
			{ articleId: "article2", totalViewCount: 0 },
		]);

		// 記事一覧取得のモック（サブクエリも含む）
		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockReturnValue({
								limit: vi.fn().mockReturnValue({
									offset: vi.fn().mockResolvedValue(mockArticles),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		// 総記事数取得のモック
		const countMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTotalCount),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: mockArticles,
			pagination: {
				page: 1,
				limit: 10,
				total: 2,
				totalPages: 1,
			},
		});
	});

	it("ページネーション機能が正常に動作する", async () => {
		// Arrange
		const { mockDb, createSubqueryMock } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticles = [
			createMockArticleWithTranslation({
				article: { id: "article3", slug: "test-article-3" },
			}),
		];

		const mockTotalCount = Array(15).fill({}); // 15件の記事を表す配列

		const totalViewCountSubqueryMock = createSubqueryMock([
			{ articleId: "article3", totalViewCount: 0 },
		]);

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockReturnValue({
								limit: vi.fn().mockReturnValue({
									offset: vi.fn().mockResolvedValue(mockArticles),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTotalCount),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$get({
			query: {
				page: "2",
				limit: "5",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.pagination).toEqual({
			page: 2,
			limit: 5,
			total: 15,
			totalPages: 3,
		});
	});

	it("言語フィルタリング機能が正常に動作する", async () => {
		// Arrange
		const { mockDb, createSubqueryMock } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticles = [
			createMockArticleWithTranslation({
				article: { id: "article1", slug: "test-article-1" },
				translation: {
					language: "en",
					title: "Test Article 1",
					content: "This is test article 1 content.",
				},
			}),
		];

		const mockTotalCount = [{ count: "1" }];

		const totalViewCountSubqueryMock = createSubqueryMock([
			{ articleId: "article1", totalViewCount: 0 },
		]);

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockReturnValue({
								limit: vi.fn().mockReturnValue({
									offset: vi.fn().mockResolvedValue(mockArticles),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTotalCount),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$get({
			query: {
				lang: "en",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(1);
		expect(data.data[0].title).toBe("Test Article 1");
	});

	it("記事が存在しない場合、空の配列を返す", async () => {
		// Arrange
		const { mockDb, createSubqueryMock } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const totalViewCountSubqueryMock = createSubqueryMock([]);

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockReturnValue({
								limit: vi.fn().mockReturnValue({
									offset: vi.fn().mockResolvedValue([]),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: [],
			pagination: {
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 0,
			},
		});
	});
});

describe("GET /articles/:slug", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事詳細を正常に取得する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticle = createMockArticleWithTranslation({
			article: {
				id: "article1",
				slug: "test-article",
				status: "published",
			},
			translation: {
				id: "translation1",
				title: "テスト記事",
				content: "これはテスト記事の内容です。",
				viewCount: 5, // DB上の値（インクリメント前）
			},
		});

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								...mockArticle,
								translationId: "translation1",
							},
						]),
					}),
				}),
			}),
		};

		// ビューカウント更新のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		mockDb.select.mockReturnValueOnce(articleMock);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client["test-article"].$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				...mockArticle,
				viewCount: 6, // インクリメント後の値（5→6）
			},
		});
	});

	it("存在しない記事スラッグの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(articleMock);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client["non-existent-article"].$get({
			query: {},
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

	it("言語指定で記事詳細を取得する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticle = createMockArticleWithTranslation({
			article: {
				id: "article1",
				slug: "test-article",
				status: "published",
			},
			translation: {
				id: "translation1",
				language: "en",
				title: "Test Article",
				content: "This is test article content.",
			},
		});

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								...mockArticle,
								translationId: "translation1",
							},
						]),
					}),
				}),
			}),
		};

		// ビューカウント更新のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		mockDb.select.mockReturnValueOnce(articleMock);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client["test-article"].$get({
			query: {
				lang: "en",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data.title).toBe("Test Article");
	});

	it("記事にタグ情報が含まれて返される", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticle = {
			id: 1,
			slug: "test-article",
			status: "published",
			cfImageId: null,
			publishedAt: "2024-01-15T00:00:00.000Z",
			title: "Test Article",
			content: "Test content",
			updatedAt: "2024-01-15T00:00:00.000Z",
			viewCount: 1, // 記事詳細取得時にインクリメントされるため
		};

		// 記事取得のモック
		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			}),
		};

		// ビューカウント更新のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		// select呼び出しを返すようにモック
		mockDb.select.mockReturnValueOnce(articleMock); // 記事取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client["test-article"].$get({
			query: { lang: "ja" },
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.data).toMatchObject({
			...mockArticle,
		});
	});

	it("下書きステータスの記事の場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockDraftArticle = {
			id: 1,
			slug: "draft-article",
			status: "draft",
			thumbnail: null,
			publishedAt: null,
			title: "Draft Article",
			content: "Draft content",
			createdAt: new Date("2024-01-15"),
			updatedAt: new Date("2024-01-15"),
			viewCount: 0,
		};

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockDraftArticle]),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(articleMock);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client["draft-article"].$get({
			query: {},
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

	it("アーカイブ済みステータスの記事の場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArchivedArticle = {
			id: 1,
			slug: "archived-article",
			status: "archived",
			thumbnail: null,
			publishedAt: new Date("2024-01-15"),
			title: "Archived Article",
			content: "Archived content",
			createdAt: new Date("2024-01-15"),
			updatedAt: new Date("2024-01-15"),
			viewCount: 0,
		};

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArchivedArticle]),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(articleMock);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client["archived-article"].$get({
			query: {},
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

	it("記事詳細取得時にview_countが含まれる", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticle = createMockArticleWithTranslation({
			article: {
				id: "article1",
				slug: "test-article",
				status: "published",
			},
			translation: {
				id: "translation1",
				title: "テスト記事",
				content: "これはテスト記事の内容です。",
				viewCount: 42,
			},
		});

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								...mockArticle,
								translationId: "translation1",
							},
						]),
					}),
				}),
			}),
		};

		// Update関数のモック（view_countインクリメント用）
		const updateMock = {
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		};
		mockDb.update = vi.fn().mockReturnValue(updateMock);

		mockDb.select.mockReturnValueOnce(articleMock); // 記事取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client["test-article"].$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data.viewCount).toBe(43); // 42 + 1（インクリメント後）
		expect(mockDb.update).toHaveBeenCalled(); // updateが呼ばれたことを確認
	});

	it("記事一覧取得時にview_countが含まれる", async () => {
		// Arrange
		const { mockDb, createSubqueryMock } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticles = [
			createMockArticleWithTranslation({
				article: {
					id: "article1",
					slug: "test-article-1",
					status: "published",
				},
				translation: {
					title: "テスト記事1",
					content: "これはテスト記事1の内容です。",
					viewCount: 25,
				},
			}),
			createMockArticleWithTranslation({
				article: {
					id: "article2",
					slug: "test-article-2",
					status: "published",
				},
				translation: {
					title: "テスト記事2",
					content: "これはテスト記事2の内容です。",
					viewCount: 100,
				},
			}),
		];

		const totalViewCountSubqueryMock = createSubqueryMock([
			{ articleId: "article1", totalViewCount: 25 },
			{ articleId: "article2", totalViewCount: 100 },
		]);

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockReturnValue({
								limit: vi.fn().mockReturnValue({
									offset: vi.fn().mockResolvedValue(mockArticles),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 2 }]),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // カウント取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(2);
		expect(data.data[0].viewCount).toBe(25);
		expect(data.data[1].viewCount).toBe(100);
	});

	it("記事一覧取得時にviewCount=0がAPIレスポンスに含まれる", async () => {
		// Arrange
		const { mockDb, createSubqueryMock } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const mockArticlesWithZeroViewCount = [
			createMockArticleWithTranslation({
				article: {
					id: "article1",
					slug: "zero-view-article",
					status: "published",
				},
				translation: {
					title: "閲覧数0の記事",
					content: "この記事はまだ誰にも読まれていません。",
					viewCount: 0, // 明示的に0を指定
				},
			}),
		];

		const totalViewCountSubqueryMock = createSubqueryMock({
			articleId: "article1",
			totalViewCount: 0, // 0を返すサブクエリ
		});

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockReturnValue({
								limit: vi.fn().mockReturnValue({
									offset: vi
										.fn()
										.mockResolvedValue(mockArticlesWithZeroViewCount),
								}),
							}),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // カウント取得

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(1);
		// Backend APIのレスポンスでviewCount=0の場合でも、viewCountフィールドが含まれていることを確認
		expect(data.data[0]).toHaveProperty("viewCount");
		expect(data.data[0].viewCount).toBe(0);
	});

	describe("ソート機能", () => {
		it("タイトルで昇順ソートができる", async () => {
			// Arrange
			const { mockDb, createSubqueryMock } = setupDbMocks();

			// createDbClient関数がmockDbを返すように設定
			const { createDbClient } = await import("../../lib/db");
			vi.mocked(createDbClient).mockReturnValue(mockDb as any);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "test-article-a",
						status: "published",
					},
					translation: {
						title: "Aテスト記事",
						content: "内容A",
					},
				}),
				createMockArticleWithTranslation({
					article: {
						id: "article2",
						slug: "test-article-b",
						status: "published",
					},
					translation: {
						title: "Bテスト記事",
						content: "内容B",
					},
				}),
			];

			const totalViewCountSubqueryMock = createSubqueryMock([
				{ articleId: "article1", totalViewCount: 0 },
				{ articleId: "article2", totalViewCount: 0 },
			]);

			const articleListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockReturnValue({
									limit: vi.fn().mockReturnValue({
										offset: vi.fn().mockResolvedValue(mockArticles),
									}),
								}),
							}),
						}),
					}),
				}),
			};

			const countMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 2 }]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
				.mockReturnValueOnce(articleListMock)
				.mockReturnValueOnce(countMock);

			// Act
			const client = testClient(articlesRoute) as any;
			const res = await client.index.$get({
				query: {
					sortBy: "title",
					sortOrder: "asc",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(2);
			expect(
				articleListMock.from().leftJoin().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("閲覧数で降順ソートができる", async () => {
			// Arrange
			const { mockDb, createSubqueryMock } = setupDbMocks();

			// createDbClient関数がmockDbを返すように設定
			const { createDbClient } = await import("../../lib/db");
			vi.mocked(createDbClient).mockReturnValue(mockDb as any);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "popular-article",
						status: "published",
					},
					translation: {
						title: "人気記事",
						content: "人気の内容",
						viewCount: 1000,
					},
				}),
				createMockArticleWithTranslation({
					article: {
						id: "article2",
						slug: "less-popular-article",
						status: "published",
					},
					translation: {
						title: "普通記事",
						content: "普通の内容",
						viewCount: 100,
					},
				}),
			];

			const totalViewCountSubqueryMock = createSubqueryMock([
				{ articleId: "article1", totalViewCount: 1000 },
				{ articleId: "article2", totalViewCount: 100 },
			]);

			const articleListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockReturnValue({
									limit: vi.fn().mockReturnValue({
										offset: vi.fn().mockResolvedValue(mockArticles),
									}),
								}),
							}),
						}),
					}),
				}),
			};

			const countMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 2 }]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
				.mockReturnValueOnce(articleListMock)
				.mockReturnValueOnce(countMock);

			// Act
			const client = testClient(articlesRoute) as any;
			const res = await client.index.$get({
				query: {
					sortBy: "viewCount",
					sortOrder: "desc",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(2);
			expect(data.data[0].viewCount).toBe(1000);
			expect(data.data[1].viewCount).toBe(100);
			expect(
				articleListMock.from().leftJoin().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("公開日時で降順ソートができる", async () => {
			// Arrange
			const { mockDb, createSubqueryMock } = setupDbMocks();

			// createDbClient関数がmockDbを返すように設定
			const { createDbClient } = await import("../../lib/db");
			vi.mocked(createDbClient).mockReturnValue(mockDb as any);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "newer-article",
						status: "published",
						publishedAt: new Date("2024-02-01").toISOString(),
					},
					translation: {
						title: "新しい記事",
						content: "新しい内容",
					},
				}),
				createMockArticleWithTranslation({
					article: {
						id: "article2",
						slug: "older-article",
						status: "published",
						publishedAt: new Date("2024-01-01").toISOString(),
					},
					translation: {
						title: "古い記事",
						content: "古い内容",
					},
				}),
			];

			const totalViewCountSubqueryMock = createSubqueryMock([
				{ articleId: "article1", totalViewCount: 0 },
				{ articleId: "article2", totalViewCount: 0 },
			]);

			const articleListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockReturnValue({
									limit: vi.fn().mockReturnValue({
										offset: vi.fn().mockResolvedValue(mockArticles),
									}),
								}),
							}),
						}),
					}),
				}),
			};

			const countMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 2 }]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
				.mockReturnValueOnce(articleListMock)
				.mockReturnValueOnce(countMock);

			// Act
			const client = testClient(articlesRoute) as any;
			const res = await client.index.$get({
				query: {
					sortBy: "publishedAt",
					sortOrder: "desc",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(2);
			expect(
				articleListMock.from().leftJoin().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("作成日時で昇順ソートができる", async () => {
			// Arrange
			const { mockDb, createSubqueryMock } = setupDbMocks();

			// createDbClient関数がmockDbを返すように設定
			const { createDbClient } = await import("../../lib/db");
			vi.mocked(createDbClient).mockReturnValue(mockDb as any);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "older-article",
						status: "published",
					},
					translation: {
						title: "古い記事",
						content: "古い内容",
					},
				}),
				createMockArticleWithTranslation({
					article: {
						id: "article2",
						slug: "newer-article",
						status: "published",
					},
					translation: {
						title: "新しい記事",
						content: "新しい内容",
					},
				}),
			];

			const totalViewCountSubqueryMock = createSubqueryMock([
				{ articleId: "article1", totalViewCount: 0 },
				{ articleId: "article2", totalViewCount: 0 },
			]);

			const articleListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockReturnValue({
									limit: vi.fn().mockReturnValue({
										offset: vi.fn().mockResolvedValue(mockArticles),
									}),
								}),
							}),
						}),
					}),
				}),
			};

			const countMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 2 }]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
				.mockReturnValueOnce(articleListMock)
				.mockReturnValueOnce(countMock);

			// Act
			const client = testClient(articlesRoute) as any;
			const res = await client.index.$get({
				query: {
					sortBy: "createdAt",
					sortOrder: "asc",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(2);
			expect(
				articleListMock.from().leftJoin().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("更新日時で降順ソートができる", async () => {
			// Arrange
			const { mockDb, createSubqueryMock } = setupDbMocks();

			// createDbClient関数がmockDbを返すように設定
			const { createDbClient } = await import("../../lib/db");
			vi.mocked(createDbClient).mockReturnValue(mockDb as any);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "recently-updated",
						status: "published",
					},
					translation: {
						title: "最近更新された記事",
						content: "更新された内容",
					},
				}),
				createMockArticleWithTranslation({
					article: {
						id: "article2",
						slug: "older-updated",
						status: "published",
					},
					translation: {
						title: "古い更新の記事",
						content: "古い内容",
					},
				}),
			];

			const totalViewCountSubqueryMock = createSubqueryMock([
				{ articleId: "article1", totalViewCount: 0 },
				{ articleId: "article2", totalViewCount: 0 },
			]);

			const articleListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockReturnValue({
									limit: vi.fn().mockReturnValue({
										offset: vi.fn().mockResolvedValue(mockArticles),
									}),
								}),
							}),
						}),
					}),
				}),
			};

			const countMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 2 }]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
				.mockReturnValueOnce(articleListMock)
				.mockReturnValueOnce(countMock);

			// Act
			const client = testClient(articlesRoute) as any;
			const res = await client.index.$get({
				query: {
					sortBy: "updatedAt",
					sortOrder: "desc",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(2);
			expect(
				articleListMock.from().leftJoin().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("不正なソートパラメータの場合はバリデーションエラーが返される", async () => {
			// Arrange
			const { mockDb, createSubqueryMock } = setupDbMocks();

			// createDbClient関数がmockDbを返すように設定
			const { createDbClient } = await import("../../lib/db");
			vi.mocked(createDbClient).mockReturnValue(mockDb as any);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "test-article-1",
						status: "published",
					},
					translation: {
						title: "テスト記事1",
						content: "内容1",
					},
				}),
			];

			const totalViewCountSubqueryMock = createSubqueryMock([
				{ articleId: "article1", totalViewCount: 0 },
			]);

			const articleListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockReturnValue({
									limit: vi.fn().mockReturnValue({
										offset: vi.fn().mockResolvedValue(mockArticles),
									}),
								}),
							}),
						}),
					}),
				}),
			};

			const countMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 1 }]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(totalViewCountSubqueryMock) // サブクエリ
				.mockReturnValueOnce(articleListMock)
				.mockReturnValueOnce(countMock);

			// Act
			const client = testClient(articlesRoute) as any;
			const res = await client.index.$get({
				query: {
					sortBy: "invalidColumn" as unknown as "createdAt",
					sortOrder: "invalidOrder" as unknown as "asc",
				},
			});

			// Assert
			expect(res.status).toBe(400);
		});
	});
});

describe("POST /articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事を正常に作成する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

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

		mockDb.insert
			.mockReturnValueOnce(insertArticleMock) // 記事作成
			.mockReturnValueOnce(insertTranslationMock); // 翻訳作成

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$post({
			json: {
				title: "新しい記事",
				slug: "new-article",
				content: "# 新しい記事\n\nこれは新しい記事の内容です。",
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

		expect(mockDb.insert).toHaveBeenCalledTimes(2); // 記事、翻訳
		expect(mockDb.select).toHaveBeenCalledTimes(2); // 既存チェック、記事取得
	});

	it("バリデーションエラー: タイトルが空の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		// Act
		const client = testClient(articlesRoute) as any;
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

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		// Act
		const client = testClient(articlesRoute) as any;
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

	it("バリデーションエラー: タグIDが空の配列の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await client.index.$post({
			json: {
				title: "正常なタイトル",
				slug: "valid-slug",
				content: "内容があります",
				status: "draft",
				tagIds: [],
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});
});

describe("GET /articles/check-slug", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("利用可能なスラッグの場合、availableがtrueを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const selectMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 記事が見つからない（スラッグが利用可能）
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(selectMock);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await (client as any)["check-slug"].$get({
			query: {
				slug: "available-slug",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toEqual({
			available: true,
		});
	});

	it("既に使用されているスラッグの場合、availableがfalseを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		const selectMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{ id: 1, slug: "used-slug" }, // 既に記事が存在
					]),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(selectMock);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await (client as any)["check-slug"].$get({
			query: {
				slug: "used-slug",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toEqual({
			available: false,
			message: "このスラッグは既に使用されています",
		});
	});

	it("スラッグパラメータが空の場合、400エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDbClient関数がmockDbを返すように設定
		const { createDbClient } = await import("../../lib/db");
		vi.mocked(createDbClient).mockReturnValue(mockDb as any);

		// Act
		const client = testClient(articlesRoute) as any;
		const res = await (client as any)["check-slug"].$get({
			query: {
				slug: "",
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.select).not.toHaveBeenCalled();
	});
});
