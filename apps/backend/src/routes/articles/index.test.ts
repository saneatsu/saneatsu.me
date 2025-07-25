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

describe("GET /articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事一覧を正常に取得する", async () => {
		// Arrange
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

		const { mockDb } = setupDbMocks();

		// 記事一覧取得のモック
		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			}),
		};

		// 総記事数取得のモック
		const countMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockTotalCount),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute);
		const res = await client.$get({
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
		const mockArticles = [
			createMockArticleWithTranslation({
				article: { id: "article3", slug: "test-article-3" },
			}),
		];

		const mockTotalCount = Array(15).fill({}); // 15件の記事を表す配列

		const { mockDb } = setupDbMocks();

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockTotalCount),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleListMock)
			.mockReturnValueOnce(countMock);

		// Act
		const res = await testClient(articlesRoute).$get({
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

		const { mockDb } = setupDbMocks();

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockTotalCount),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleListMock)
			.mockReturnValueOnce(countMock);

		// Act
		const res = await testClient(articlesRoute).$get({
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
		const { mockDb } = setupDbMocks();

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([]),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleListMock)
			.mockReturnValueOnce(countMock);

		// Act
		const client = testClient(articlesRoute);
		const res = await client.$get({
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
		const mockArticle = createMockArticleWithTranslation({
			article: {
				id: "article1",
				slug: "test-article",
				status: "published",
			},
			translation: {
				title: "テスト記事",
				content: "これはテスト記事の内容です。",
			},
		});

		const { mockDb } = setupDbMocks();

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValue(articleMock);

		// Act
		const res = await testClient(articlesRoute)["test-article"].$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: mockArticle,
		});
	});

	it("存在しない記事スラッグの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValue(articleMock);

		// Act
		const res = await testClient(articlesRoute)["non-existent-article"].$get({
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
		const mockArticle = createMockArticleWithTranslation({
			article: {
				id: "article1",
				slug: "test-article",
			},
			translation: {
				language: "en",
				title: "Test Article",
				content: "This is test article content.",
			},
		});

		const { mockDb } = setupDbMocks();

		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValue(articleMock);

		// Act
		const res = await testClient(articlesRoute)["test-article"].$get({
			query: {
				lang: "en",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data.title).toBe("Test Article");
	});
});
