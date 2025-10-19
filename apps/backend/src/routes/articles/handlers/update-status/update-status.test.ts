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

describe("PATCH /articles/:id/status - 記事ステータス更新", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事ステータスを正常に更新する（publishedに変更）", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック（publishedAtがnull）
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{
							id: 1,
							status: "draft",
							publishedAt: null,
						},
					]),
				}),
			}),
		};

		// 更新後の記事取得のモック
		const updatedArticleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								id: 1,
								slug: "test-article",
								cfImageId: null,
								status: "published",
								publishedAt: "2024-01-01T00:00:00.000Z",
								updatedAt: "2024-01-01T00:00:00.000Z",
								title: "テスト記事",
								content: "これはテスト記事の内容です。",
								viewCount: 0,
							},
						]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
			.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得

		// update関数のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].status.$patch({
			param: { id: "1" },
			json: {
				status: "published",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				id: 1,
				slug: "test-article",
				cfImageId: null,
				status: "published",
				publishedAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				title: "テスト記事",
				content: "これはテスト記事の内容です。",
				viewCount: 0,
			},
			message: "記事ステータスが正常に更新されました",
		});

		expect(mockDb.update).toHaveBeenCalledTimes(1);
	});

	it("存在しないIDの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック（記事が見つからない）
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(existingArticleMock);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].status.$patch({
			param: { id: "9999" },
			json: {
				status: "published",
			},
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

	it("下書きステータスに変更する（publishedAtがnullになる）", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック（publishedAtがある）
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{
							id: 1,
							status: "published",
							publishedAt: "2024-01-01T00:00:00.000Z",
						},
					]),
				}),
			}),
		};

		// 更新後の記事取得のモック（publishedAtがnull）
		const updatedArticleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								id: 1,
								slug: "test-article",
								cfImageId: null,
								status: "draft",
								publishedAt: null,
								updatedAt: "2024-01-02T00:00:00.000Z",
								title: "テスト記事",
								content: "これはテスト記事の内容です。",
								viewCount: 0,
							},
						]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
			.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得

		// update関数のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].status.$patch({
			param: { id: "1" },
			json: {
				status: "draft",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.data.status).toBe("draft");
		expect(data.data.publishedAt).toBe(null);
		expect(mockDb.update).toHaveBeenCalledTimes(1);
	});
});
