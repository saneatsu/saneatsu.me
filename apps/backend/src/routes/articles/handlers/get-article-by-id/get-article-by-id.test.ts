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

describe("GET /articles/admin/:id - 管理画面用記事詳細取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事詳細を正常に取得する（タグ情報も含む）", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockArticle = createMockArticleWithTranslation({
			article: {
				id: "1",
				slug: "test-article",
				status: "published",
			},
			translation: {
				title: "テスト記事",
				content: "これはテスト記事の内容です。",
			},
		});

		const mockTagsData = [
			{
				tagId: 1,
				tagSlug: "javascript",
				tagCreatedAt: "2024-01-01T00:00:00.000Z",
				tagUpdatedAt: "2024-01-01T00:00:00.000Z",
				tagName: "JavaScript",
				tagLanguage: "ja",
			},
			{
				tagId: 1,
				tagSlug: "javascript",
				tagCreatedAt: "2024-01-01T00:00:00.000Z",
				tagUpdatedAt: "2024-01-01T00:00:00.000Z",
				tagName: "JavaScript",
				tagLanguage: "en",
			},
			{
				tagId: 2,
				tagSlug: "typescript",
				tagCreatedAt: "2024-01-01T00:00:00.000Z",
				tagUpdatedAt: "2024-01-01T00:00:00.000Z",
				tagName: "TypeScript",
				tagLanguage: "ja",
			},
			{
				tagId: 2,
				tagSlug: "typescript",
				tagCreatedAt: "2024-01-01T00:00:00.000Z",
				tagUpdatedAt: "2024-01-01T00:00:00.000Z",
				tagName: "TypeScript",
				tagLanguage: "en",
			},
		];

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

		// タグ取得のモック（2回のinnerJoinに対応）
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockTagsData),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(tagsMock); // タグ取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.admin[":id"].$get({
			param: { id: "1" },
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				...mockArticle,
				tags: [
					{
						id: 1,
						slug: "javascript",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
						articleCount: 0,
						translations: { ja: "JavaScript", en: "JavaScript" },
					},
					{
						id: 2,
						slug: "typescript",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
						articleCount: 0,
						translations: { ja: "TypeScript", en: "TypeScript" },
					},
				],
			},
		});
	});

	it("存在しないIDの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

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
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.admin[":id"].$get({
			param: { id: "9999" },
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

	it("無効なIDフォーマットの場合、400エラーを返す", async () => {
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
		const res = await client.admin[":id"].$get({
			param: { id: "invalid" },
			query: {},
		});

		// Assert
		expect(res.status).toBe(400);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "INVALID_ID",
				message: "Invalid article ID",
			},
		});
	});

	it("下書きステータスの記事も取得できる（管理画面用）", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockDraftArticle = createMockArticleWithTranslation({
			article: {
				id: "1",
				slug: "draft-article",
				status: "draft",
			},
			translation: {
				title: "下書き記事",
				content: "これは下書きの内容です。",
			},
		});

		// 記事取得のモック
		const articleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockDraftArticle]),
					}),
				}),
			}),
		};

		// タグ取得のモック（タグなし）
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(tagsMock); // タグ取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.admin[":id"].$get({
			param: { id: "1" },
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.data.status).toBe("draft");
		expect(data.data.title).toBe("下書き記事");
	});

	it("includeAllTranslations=trueの場合、全言語の翻訳を取得する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockArticle = createMockArticleWithTranslation({
			article: {
				id: "1",
				slug: "test-article",
				status: "published",
			},
			translation: {
				title: "テスト記事",
				content: "これはテスト記事の内容です。",
			},
		});

		// 全言語の翻訳データ
		const mockTranslations = [
			{
				language: "ja",
				title: "テスト記事",
				content: "これはテスト記事の内容です。",
			},
			{
				language: "en",
				title: "Test Article",
				content: "This is the test article content.",
			},
		];

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

		// 全翻訳取得のモック
		const translationsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockTranslations),
			}),
		};

		// タグ取得のモック（タグなし）
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(translationsMock) // 全翻訳取得
			.mockReturnValueOnce(tagsMock); // タグ取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.admin[":id"].$get({
			param: { id: "1" },
			query: { includeAllTranslations: true },
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		// translations フィールドが含まれることを確認
		expect(data.data.translations).toBeDefined();
		expect(data.data.translations.ja).toEqual({
			title: "テスト記事",
			content: "これはテスト記事の内容です。",
		});
		expect(data.data.translations.en).toEqual({
			title: "Test Article",
			content: "This is the test article content.",
		});
	});
});
