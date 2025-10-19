import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { articlesRoute } from "@/routes/articles";
import { setupDbMocks } from "@/utils/drizzle-test";

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

// getUserByEmail関数をモック
vi.mock("../../../auth/service", () => ({
	getUserByEmail: vi.fn().mockResolvedValue({
		id: "user123",
		email: "nito.tech.official@gmail.com",
		name: "Test User",
	}),
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

		expect(mockDb.insert).toHaveBeenCalledTimes(3); // 記事、翻訳、タグ関連
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
});
