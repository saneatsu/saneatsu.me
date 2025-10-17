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
	users: {},
	createDatabaseClient: vi.fn(),
}));

describe("PUT /articles/:id - 記事更新", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事を正常に更新する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([{ id: 1, slug: "old-slug" }]),
				}),
			}),
		};

		// スラッグ重複チェックのモック（重複なし）
		const duplicateSlugMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		// 更新後の記事取得のモック（GEMINI_API_KEYがないので3回目のselect呼び出し）
		const updatedArticleMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								id: 1,
								slug: "updated-article",
								cfImageId: null,
								status: "published",
								publishedAt: "2024-01-01T00:00:00.000Z",
								updatedAt: "2024-01-02T00:00:00.000Z",
								title: "更新された記事",
								content: "これは更新された内容です。",
								viewCount: 0,
							},
						]),
					}),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
			.mockReturnValueOnce(duplicateSlugMock) // スラッグ重複チェック
			.mockReturnValueOnce(updatedArticleMock); // 更新後の記事取得（英語翻訳はスキップ）

		// update関数のモック
		mockDb.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
		});

		// delete関数のモック（タグ削除用）
		mockDb.delete = vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue({}),
		});

		// insert関数のモック（タグ追加用）
		mockDb.insert = vi.fn().mockReturnValue({
			values: vi.fn().mockResolvedValue({}),
		});

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].$put({
			param: { id: "1" },
			json: {
				title: "更新された記事",
				slug: "updated-article",
				content: "これは更新された内容です。",
				status: "published",
				tagIds: [1, 2],
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				id: 1,
				slug: "updated-article",
				cfImageId: null,
				status: "published",
				publishedAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
				title: "更新された記事",
				content: "これは更新された内容です。",
				viewCount: 0,
			},
			message: "記事が正常に更新されました",
		});

		expect(mockDb.update).toHaveBeenCalledTimes(2); // 記事と翻訳の更新
		expect(mockDb.delete).toHaveBeenCalledTimes(1); // タグ削除
		expect(mockDb.insert).toHaveBeenCalledTimes(1); // タグ追加
	});

	it("存在しないIDの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
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
		const res = await client[":id"].$put({
			param: { id: "9999" },
			json: {
				title: "更新された記事",
				slug: "updated-article",
				content: "これは更新された内容です。",
				status: "published",
				tagIds: [1, 2],
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

	it("スラッグが既に使用されている場合、409エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 既存記事チェックのモック
		const existingArticleMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([{ id: 1, slug: "old-slug" }]),
				}),
			}),
		};

		// スラッグ重複チェックのモック（重複あり）
		const duplicateSlugMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([{ id: 2 }]),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(existingArticleMock) // 既存記事チェック
			.mockReturnValueOnce(duplicateSlugMock); // スラッグ重複チェック

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client[":id"].$put({
			param: { id: "1" },
			json: {
				title: "更新された記事",
				slug: "existing-slug",
				content: "これは更新された内容です。",
				status: "published",
				tagIds: [1, 2],
			},
		});

		// Assert
		expect(res.status).toBe(409);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "SLUG_ALREADY_EXISTS",
				message: "このスラッグは既に使用されています",
			},
		});
	});
});
