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

describe("GET /articles/:slug/related - 関連記事取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグが一致する関連記事を正常に取得する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 現在の記事（タグID: 1, 2を持つ）
		const currentArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{
							id: 1,
							status: "published",
						},
					]),
				}),
			}),
		};

		// 現在の記事のタグ
		const currentArticleTagsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ tagId: 1 }, { tagId: 2 }]),
			}),
		};

		// タグマッチする記事ID
		const matchingArticleIdsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ articleId: 2 }, { articleId: 3 }]),
			}),
		};

		// 関連記事（タグマッチ）
		const relatedArticles = [
			createMockArticleWithTranslation({
				article: {
					id: "2",
					slug: "related-article-1",
					status: "published",
				},
				translation: {
					title: "関連記事1",
					content: "内容1",
				},
			}),
			createMockArticleWithTranslation({
				article: {
					id: "3",
					slug: "related-article-2",
					status: "published",
				},
				translation: {
					title: "関連記事2",
					content: "内容2",
				},
			}),
		];

		const matchingArticlesMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(relatedArticles),
						}),
					}),
				}),
			}),
		};

		// タグ情報
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{
								articleId: 2,
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "ja",
							},
							{
								articleId: 3,
								tagId: 2,
								tagSlug: "react",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "React",
								tagLanguage: "ja",
							},
						]),
					}),
				}),
			}),
		};

		// 最新記事（補完用）
		const latestArticlesMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			}),
		};

		// タグ情報（最新記事用）
		const latestArticleTagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(currentArticleMock) // 現在の記事取得
			.mockReturnValueOnce(currentArticleTagsMock) // 現在の記事のタグ取得
			.mockReturnValueOnce(matchingArticlesMock) // 関連記事取得
			.mockReturnValueOnce(tagsMock) // タグ情報取得
			.mockReturnValueOnce(latestArticlesMock) // 最新記事取得（補完）
			.mockReturnValueOnce(latestArticleTagsMock); // 最新記事のタグ情報取得

		mockDb.selectDistinct.mockReturnValueOnce(matchingArticleIdsMock); // タグマッチする記事ID取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":slug"].related.$get({
			param: { slug: "current-article" },
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(2);
		expect(data.data[0].slug).toBe("related-article-1");
	});

	it("関連記事が不足する場合、最新記事で補完する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 現在の記事
		const currentArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{
							id: 1,
							status: "published",
						},
					]),
				}),
			}),
		};

		// 現在の記事のタグ（タグ1つだけ）
		const currentArticleTagsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ tagId: 1 }]),
			}),
		};

		// タグマッチする記事ID（1件だけ）
		const matchingArticleIdsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ articleId: 2 }]),
			}),
		};

		// 関連記事（タグマッチ）1件
		const relatedArticle = [
			createMockArticleWithTranslation({
				article: {
					id: "2",
					slug: "related-article-1",
					status: "published",
				},
				translation: {
					title: "関連記事1",
					content: "内容1",
				},
			}),
		];

		const matchingArticlesMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(relatedArticle),
						}),
					}),
				}),
			}),
		};

		// タグ情報（関連記事用）
		const relatedArticleTagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{
								articleId: 2,
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "ja",
							},
						]),
					}),
				}),
			}),
		};

		// 最新記事（補完用）
		const latestArticles = [
			createMockArticleWithTranslation({
				article: {
					id: "3",
					slug: "latest-article-1",
					status: "published",
				},
				translation: {
					title: "最新記事1",
					content: "内容1",
				},
			}),
			createMockArticleWithTranslation({
				article: {
					id: "4",
					slug: "latest-article-2",
					status: "published",
				},
				translation: {
					title: "最新記事2",
					content: "内容2",
				},
			}),
		];

		const latestArticlesMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(latestArticles),
						}),
					}),
				}),
			}),
		};

		// タグ情報（最新記事用）
		const latestArticleTagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(currentArticleMock) // 現在の記事取得
			.mockReturnValueOnce(currentArticleTagsMock) // 現在の記事のタグ取得
			.mockReturnValueOnce(matchingArticlesMock) // 関連記事取得
			.mockReturnValueOnce(relatedArticleTagsMock) // 関連記事のタグ情報取得
			.mockReturnValueOnce(latestArticlesMock) // 最新記事取得
			.mockReturnValueOnce(latestArticleTagsMock); // 最新記事のタグ情報取得

		mockDb.selectDistinct.mockReturnValueOnce(matchingArticleIdsMock); // タグマッチする記事ID取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":slug"].related.$get({
			param: { slug: "current-article" },
			query: { limit: "3" },
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(3);
		expect(data.data[0].slug).toBe("related-article-1");
		expect(data.data[1].slug).toBe("latest-article-1");
		expect(data.data[2].slug).toBe("latest-article-2");
	});

	it("存在しない記事の場合は404を返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 記事が見つからない
		const currentArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(currentArticleMock);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":slug"].related.$get({
			param: { slug: "non-existent-article" },
			query: {},
		});

		// Assert
		expect(res.status).toBe(404);
		const data = await res.json();
		expect(data.error.code).toBe("NOT_FOUND");
	});

	it("公開済み以外の記事の場合は404を返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 下書き記事
		const currentArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{
							id: 1,
							status: "draft",
						},
					]),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(currentArticleMock);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":slug"].related.$get({
			param: { slug: "draft-article" },
			query: {},
		});

		// Assert
		expect(res.status).toBe(404);
		const data = await res.json();
		expect(data.error.code).toBe("NOT_FOUND");
	});

	it("タグがない記事の場合は最新記事のみを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 現在の記事
		const currentArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{
							id: 1,
							status: "published",
						},
					]),
				}),
			}),
		};

		// 現在の記事のタグ（タグなし）
		const currentArticleTagsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([]),
			}),
		};

		// 最新記事
		const latestArticles = [
			createMockArticleWithTranslation({
				article: {
					id: "2",
					slug: "latest-article-1",
					status: "published",
				},
				translation: {
					title: "最新記事1",
					content: "内容1",
				},
			}),
		];

		const latestArticlesMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(latestArticles),
						}),
					}),
				}),
			}),
		};

		// タグ情報（最新記事用）
		const latestArticleTagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(currentArticleMock) // 現在の記事取得
			.mockReturnValueOnce(currentArticleTagsMock) // 現在の記事のタグ取得
			.mockReturnValueOnce(latestArticlesMock) // 最新記事取得
			.mockReturnValueOnce(latestArticleTagsMock); // 最新記事のタグ情報取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":slug"].related.$get({
			param: { slug: "current-article" },
			query: { limit: "1" },
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(1);
		expect(data.data[0].slug).toBe("latest-article-1");
	});
});
