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

// extractHeadingsのモック
vi.mock("@/utils/markdown", () => ({
	extractHeadings: vi.fn(),
}));

describe("GET /articles/suggestions - 記事サジェスト取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("日本語検索", () => {
		it("漢字を含む検索クエリで記事タイトルがヒットすること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);
			mockExtractHeadings.mockReturnValue([]);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "article-106",
						status: "published",
					},
					translation: {
						title: "TypeScript実践テクニック 106",
						content: "TypeScriptの実践的なテクニックを紹介します。",
					},
				}),
				createMockArticleWithTranslation({
					article: {
						id: "article2",
						slug: "article-176",
						status: "published",
					},
					translation: {
						title: "TypeScript実践テクニック 176",
						content: "TypeScriptの高度な実践テクニックを解説します。",
					},
				}),
			];

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// INNER JOINクエリのモック
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "実践",
					lang: "ja",
					limit: "5",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(2);
			expect(json.suggestions[0].title).toBe("TypeScript実践テクニック 106");
			expect(json.suggestions[1].title).toBe("TypeScript実践テクニック 176");
			expect(json.fromCache).toBe(false);
		});

		it("見出しから日本語検索がヒットすること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "article-003",
						status: "published",
					},
					translation: {
						title: "Next.js パフォーマンス最適化 3",
						content: `## 実践的な例

パフォーマンス最適化の実践的な例を紹介します。`,
					},
				}),
			];

			// 見出しのモック
			mockExtractHeadings.mockReturnValue([
				{
					level: 2,
					text: "実践的な例",
					id: "practical-example",
				},
			]);

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// 最初のクエリ（記事タイトル検索）は空を返す
			mockDb.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			});

			// 2回目のクエリ（全記事取得）
			mockDb.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "実践",
					lang: "ja",
					limit: "5",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(1);
			expect(json.suggestions[0].type).toBe("heading");
			expect(json.suggestions[0].title).toBe("実践的な例");
			expect(json.suggestions[0].headingLevel).toBe(2);
			expect(json.suggestions[0].articleTitle).toBe(
				"Next.js パフォーマンス最適化 3"
			);
		});
	});

	describe("英語検索（大文字小文字を区別しない）", () => {
		it("小文字のクエリで大文字を含むタイトルがヒットすること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);
			mockExtractHeadings.mockReturnValue([]);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "article-001",
						status: "published",
					},
					translation: {
						title: "TypeScript Best Practices",
						content: "Learn TypeScript best practices.",
						language: "en",
					},
				}),
			];

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "type",
					lang: "en",
					limit: "5",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(1);
			expect(json.suggestions[0].title).toBe("TypeScript Best Practices");
		});

		it("大文字のクエリで小文字を含むタイトルがヒットすること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);
			mockExtractHeadings.mockReturnValue([]);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "article-002",
						status: "published",
					},
					translation: {
						title: "javascript patterns",
						content: "Common javascript patterns.",
						language: "en",
					},
				}),
			];

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "JAVA",
					lang: "en",
					limit: "5",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(1);
			expect(json.suggestions[0].title).toBe("javascript patterns");
		});

		it("見出し検索でも大文字小文字を区別しないこと", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "article-003",
						status: "published",
					},
					translation: {
						title: "React Hooks Guide",
						content: `## useEffect Hook

Learn about the useEffect hook.`,
						language: "en",
					},
				}),
			];

			// 見出しのモック
			mockExtractHeadings.mockReturnValue([
				{
					level: 2,
					text: "useEffect Hook",
					id: "useeffect-hook",
				},
			]);

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// 最初のクエリ（記事タイトル検索）は空を返す
			mockDb.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			});

			// 2回目のクエリ（全記事取得）
			mockDb.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "EFFECT",
					lang: "en",
					limit: "5",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(1);
			expect(json.suggestions[0].type).toBe("heading");
			expect(json.suggestions[0].title).toBe("useEffect Hook");
		});
	});

	describe("基本機能", () => {
		it("空のクエリで全記事を取得できること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);
			mockExtractHeadings.mockReturnValue([]);

			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						slug: "article-001",
					},
					translation: {
						title: "テスト記事1",
					},
				}),
				createMockArticleWithTranslation({
					article: {
						slug: "article-002",
					},
					translation: {
						title: "テスト記事2",
					},
				}),
			];

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "",
					lang: "ja",
					limit: "5",
				},
			});
			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(2);
			expect(json.suggestions[0].title).toBe("テスト記事1");
			expect(json.suggestions[1].title).toBe("テスト記事2");
		});

		it("公開済みの記事のみが検索されること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);
			mockExtractHeadings.mockReturnValue([]);

			// 公開済みの記事のみ返す（下書きは含まれない）
			const mockArticles = [
				createMockArticleWithTranslation({
					article: {
						id: "article1",
						slug: "published-article",
						status: "published",
					},
					translation: {
						title: "公開済みの記事",
						content: "この記事は公開済みです。",
					},
				}),
			];

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "記事",
					lang: "ja",
					limit: "10",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(1);
			expect(json.suggestions[0].slug).toBe("published-article");
		});

		it("limitパラメータが正しく動作すること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);
			mockExtractHeadings.mockReturnValue([]);

			const mockArticles = Array.from({ length: 3 }, (_, i) =>
				createMockArticleWithTranslation({
					article: {
						id: `article${i}`,
						slug: `article-${i}`,
						status: "published",
					},
					translation: {
						title: `テスト記事 ${i}`,
						content: `テスト記事 ${i} の内容`,
					},
				})
			);

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// limitは内部で数値に変換されるため、3件のデータを返す
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(mockArticles.slice(0, 2)),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "テスト",
					lang: "ja",
					limit: "2",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.suggestions).toHaveLength(2);
		});

		it("fromCacheフィールドが含まれること", async () => {
			// Arrange
			const { extractHeadings } = await import("@/utils/markdown");
			const mockExtractHeadings = vi.mocked(extractHeadings);
			mockExtractHeadings.mockReturnValue([]);

			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			});

			// Act
			const client = testClient(articlesRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: {
					q: "test",
					lang: "ja",
					limit: "5",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json).toHaveProperty("fromCache");
			expect(json.fromCache).toBe(false);
		});
	});
});
