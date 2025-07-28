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
		const client = testClient(articlesRoute) as any;
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
		const res = await (testClient(articlesRoute) as any).$get({
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
		const res = await (testClient(articlesRoute) as any).$get({
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
		const client = testClient(articlesRoute) as any;
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
		const res = await (testClient(articlesRoute) as any)["test-article"].$get({
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
		const res = await (testClient(articlesRoute) as any)[
			"non-existent-article"
		].$get({
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
		const res = await (testClient(articlesRoute) as any)["test-article"].$get({
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

		const mockArticle = {
			id: 1,
			slug: "test-article",
			status: "published",
			thumbnail: null,
			publishedAt: new Date("2024-01-15"),
			title: "Test Article",
			content: "Test content",
			createdAt: new Date("2024-01-15"),
			updatedAt: new Date("2024-01-15"),
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

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{ id: 1, slug: "tech", name: "技術" },
							{ id: 2, slug: "life", name: "生活" },
						]),
					}),
				}),
			}),
		};

		// select呼び出しを順番に返すようにモック
		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(tagsMock); // タグ取得

		// Act
		const res = await (testClient(articlesRoute) as any)["test-article"].$get({
			query: { lang: "ja" },
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.data).toMatchObject({
			...mockArticle,
			tags: [
				{ id: 1, slug: "tech", name: "技術" },
				{ id: 2, slug: "life", name: "生活" },
			],
		});
	});

	it("下書きステータスの記事の場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

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

		mockDb.select.mockReturnValue(articleMock);

		// Act
		const res = await (testClient(articlesRoute) as any)["draft-article"].$get({
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

		mockDb.select.mockReturnValue(articleMock);

		// Act
		const res = await (testClient(articlesRoute) as any)["archived-article"].$get({
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
});
