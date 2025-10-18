import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { articlesRoute } from "@/routes/articles";
import { setupDbMocks } from "@/utils/drizzle-test";
import { createMockArticleWithTranslation } from "@/utils/vitest";

// モック設定
vi.mock("@saneatsu/db/worker", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	tags: {},
	users: {},
	createDatabaseClient: vi.fn(),
}));

describe("GET /articles - 記事一覧取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事一覧を正常に取得する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

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

		// 記事一覧取得のモック（正しいチェーン構造）
		const articleListMock = {
			from: vi.fn().mockReturnValue({
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
		};

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
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
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(tagsMock) // タグ情報取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: mockArticles.map((article) => ({ ...article, tags: [] })),
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
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockArticles = [
			createMockArticleWithTranslation({
				article: { id: "article3", slug: "test-article-3" },
			}),
		];

		const mockTotalCount = Array(15).fill({}); // 15件の記事を表す配列

		const articleListMock = {
			from: vi.fn().mockReturnValue({
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
		};

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
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
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(tagsMock) // タグ情報取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
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
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

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

		const articleListMock = {
			from: vi.fn().mockReturnValue({
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
		};

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
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
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(tagsMock) // タグ情報取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
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
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const articleListMock = {
			from: vi.fn().mockReturnValue({
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
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
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

	describe("ソート機能", () => {
		it("タイトルで昇順ソートができる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
						viewCount: 0,
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
						viewCount: 0,
					},
				}),
			];

			const articleListMock = {
				from: vi.fn().mockReturnValue({
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
			};

			// タグ情報取得のモック
			const tagsMock = {
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
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
				.mockReturnValueOnce(articleListMock) // 記事一覧取得
				.mockReturnValueOnce(tagsMock) // タグ情報取得
				.mockReturnValueOnce(countMock); // 総記事数取得

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
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
				articleListMock.from().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("閲覧数で降順ソートができる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
						viewCount: 0,
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
						viewCount: 0,
					},
				}),
			];

			const articleListMock = {
				from: vi.fn().mockReturnValue({
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
			};

			// タグ情報取得のモック
			const tagsMock = {
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
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
				.mockReturnValueOnce(articleListMock) // 記事一覧取得
				.mockReturnValueOnce(tagsMock) // タグ情報取得
				.mockReturnValueOnce(countMock); // 総記事数取得

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
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
			expect(data.data[0].viewCount).toBe(0);
			expect(data.data[1].viewCount).toBe(0);
			expect(
				articleListMock.from().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("公開日時で降順ソートができる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
						viewCount: 0,
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
						viewCount: 0,
					},
				}),
			];

			const articleListMock = {
				from: vi.fn().mockReturnValue({
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
			};

			// タグ情報取得のモック
			const tagsMock = {
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
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
				.mockReturnValueOnce(articleListMock) // 記事一覧取得
				.mockReturnValueOnce(tagsMock) // タグ情報取得
				.mockReturnValueOnce(countMock); // 総記事数取得

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
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
				articleListMock.from().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("作成日時で昇順ソートができる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
						viewCount: 0,
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
						viewCount: 0,
					},
				}),
			];

			const articleListMock = {
				from: vi.fn().mockReturnValue({
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
			};

			// タグ情報取得のモック
			const tagsMock = {
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
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
				.mockReturnValueOnce(articleListMock) // 記事一覧取得
				.mockReturnValueOnce(tagsMock) // タグ情報取得
				.mockReturnValueOnce(countMock); // 総記事数取得

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
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
				articleListMock.from().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("更新日時で降順ソートができる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
						viewCount: 0,
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
						viewCount: 0,
					},
				}),
			];

			const articleListMock = {
				from: vi.fn().mockReturnValue({
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
			};

			// タグ情報取得のモック
			const tagsMock = {
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
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
				.mockReturnValueOnce(articleListMock) // 記事一覧取得
				.mockReturnValueOnce(tagsMock) // タグ情報取得
				.mockReturnValueOnce(countMock); // 総記事数取得

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
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
				articleListMock.from().leftJoin().where().orderBy
			).toHaveBeenCalled();
		});

		it("不正なソートパラメータの場合はバリデーションエラーが返される", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
						viewCount: 0,
					},
				}),
			];

			const articleListMock = {
				from: vi.fn().mockReturnValue({
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
			};

			// タグ情報取得のモック
			const tagsMock = {
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
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
				.mockReturnValueOnce(articleListMock) // 記事一覧取得
				.mockReturnValueOnce(tagsMock) // タグ情報取得
				.mockReturnValueOnce(countMock); // 総記事数取得

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
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
