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
	dailyArticleViews: {},
	createDatabaseClient: vi.fn(),
}));

vi.mock("@saneatsu/db", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	tags: {},
	tagTranslations: {},
	users: {},
	dailyArticleViews: {},
	createDatabaseClient: vi.fn(),
}));

// getUserByEmail関数をモック
vi.mock("../../../auth/service", () => ({
	getUserByEmail: vi.fn().mockResolvedValue({
		id: "user123",
		email: "nito.tech.official@gmail.com",
		name: "Test User",
	}),
}));

describe("GET /articles/:slug - 記事詳細取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事詳細を正常に取得する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

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

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "ja",
							},
							{
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "en",
							},
							{
								tagId: 2,
								tagSlug: "nextjs",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "Next.js",
								tagLanguage: "ja",
							},
							{
								tagId: 2,
								tagSlug: "nextjs",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "Next.js",
								tagLanguage: "en",
							},
						]),
					}),
				}),
			}),
		};

		// 日別閲覧数インサートのモック（UPSERT）
		mockDb.insert = vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				onConflictDoUpdate: vi.fn().mockResolvedValue({}),
			}),
		});

		// ビューカウント更新のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(tagsMock); // タグ情報取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
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
				tags: [
					{
						id: 1,
						slug: "typescript",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
						articleCount: 0,
						translations: { ja: "TypeScript", en: "TypeScript" },
					},
					{
						id: 2,
						slug: "nextjs",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
						articleCount: 0,
						translations: { ja: "Next.js", en: "Next.js" },
					},
				],
			},
		});
	});

	it("存在しない記事スラッグの場合、404エラーを返す", async () => {
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

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

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

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "ja",
							},
							{
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "en",
							},
						]),
					}),
				}),
			}),
		};

		// 日別閲覧数インサートのモック（UPSERT）
		mockDb.insert = vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				onConflictDoUpdate: vi.fn().mockResolvedValue({}),
			}),
		});

		// ビューカウント更新のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(tagsMock); // タグ情報取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client["test-article"].$get({
			query: {
				lang: "en",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data.title).toBe("Test Article");
		expect(data.data.tags).toEqual([
			{
				id: 1,
				slug: "typescript",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				articleCount: 0,
				translations: { ja: "TypeScript", en: "TypeScript" },
			},
		]);
	});

	it("下書きステータスの記事の場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockDraftArticle = {
			id: 1,
			slug: "draft-article",
			status: "draft",
			cfImageId: null,
			publishedAt: null,
			title: "Draft Article",
			content: "Draft content",
			updatedAt: "2024-01-15T00:00:00.000Z",
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
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
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

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockArchivedArticle = {
			id: 1,
			slug: "archived-article",
			status: "archived",
			cfImageId: null,
			publishedAt: "2024-01-15T00:00:00.000Z",
			title: "Archived Article",
			content: "Archived content",
			updatedAt: "2024-01-15T00:00:00.000Z",
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
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
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

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

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

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "ja",
							},
							{
								tagId: 1,
								tagSlug: "typescript",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "TypeScript",
								tagLanguage: "en",
							},
							{
								tagId: 2,
								tagSlug: "nextjs",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "Next.js",
								tagLanguage: "ja",
							},
							{
								tagId: 2,
								tagSlug: "nextjs",
								tagCreatedAt: "2024-01-01T00:00:00.000Z",
								tagUpdatedAt: "2024-01-01T00:00:00.000Z",
								tagName: "Next.js",
								tagLanguage: "en",
							},
						]),
					}),
				}),
			}),
		};

		// 日別閲覧数インサートのモック（UPSERT）
		mockDb.insert = vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				onConflictDoUpdate: vi.fn().mockResolvedValue({}),
			}),
		});

		// Update関数のモック（view_countインクリメント用）
		const updateMock = {
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		};
		mockDb.update = vi.fn().mockReturnValue(updateMock);

		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(tagsMock); // タグ情報取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client["test-article"].$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data.viewCount).toBe(43); // 42 + 1（インクリメント後）
		expect(data.data.tags).toEqual([
			{
				id: 1,
				slug: "typescript",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				articleCount: 0,
				translations: { ja: "TypeScript", en: "TypeScript" },
			},
			{
				id: 2,
				slug: "nextjs",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				articleCount: 0,
				translations: { ja: "Next.js", en: "Next.js" },
			},
		]);
		expect(mockDb.update).toHaveBeenCalled(); // updateが呼ばれたことを確認
	});

	it("ログイン中のユーザー（作者以外）が記事を閲覧した場合、閲覧数が増えない", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

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
				viewCount: 10,
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

		// タグ情報取得のモック
		const tagsMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
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

		mockDb.select
			.mockReturnValueOnce(articleMock) // 記事取得
			.mockReturnValueOnce(tagsMock); // タグ情報取得

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client["test-article"].$get(
			{
				query: {},
			},
			{
				headers: {
					"X-User-Email": "test@example.com", // ログイン中のユーザー
				},
			}
		);

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data.viewCount).toBe(10); // インクリメントされない（10のまま）
		expect(mockDb.update).not.toHaveBeenCalled(); // updateが呼ばれないことを確認
	});
});
