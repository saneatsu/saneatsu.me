import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// モック設定
vi.mock("@saneatsu/db/worker", () => ({
	articles: {},
	articleTags: {},
	tags: {},
	createDatabaseClient: vi.fn(),
}));

describe("GET /tags - タグ一覧取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Integration Test", () => {
		it("タグ一覧を正常に取得する（記事カウントも含む）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockTags = [
				{
					id: 1,
					slug: "typescript",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 5,
				},
				{
					id: 2,
					slug: "javascript",
					createdAt: "2024-01-03T00:00:00.000Z",
					updatedAt: "2024-01-04T00:00:00.000Z",
					articleCount: 3,
				},
			];

			// タグ一覧取得のモック（LEFT JOIN → GROUP BY → ORDER BY）
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						groupBy: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(mockTags),
						}),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get();

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data).toEqual({
				data: mockTags,
			});
			expect(data.data).toHaveLength(2);
			expect(data.data[0].articleCount).toBe(5);
			expect(data.data[1].articleCount).toBe(3);
		});

		it("タグが存在しない場合、空の配列を返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						groupBy: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get();

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data).toEqual({
				data: [],
			});
		});

		it("記事が紐付いていないタグは記事カウントが0になる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockTags = [
				{
					id: 1,
					slug: "typescript",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 5,
				},
				{
					id: 2,
					slug: "未使用タグ",
					createdAt: "2024-01-03T00:00:00.000Z",
					updatedAt: "2024-01-04T00:00:00.000Z",
					articleCount: 0,
				},
			];

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						groupBy: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(mockTags),
						}),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get();

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.data).toHaveLength(2);
			expect(data.data[1].articleCount).toBe(0);
		});

		it("データベースエラーの場合、500エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// データベースエラーをシミュレート
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						groupBy: vi.fn().mockReturnValue({
							orderBy: vi
								.fn()
								.mockRejectedValue(new Error("Database connection failed")),
						}),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get();

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();

			expect(data).toEqual({
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tags",
				},
			});
		});

		it("タグが作成日時順でソートされる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockTags = [
				{
					id: 1,
					slug: "古いタグ",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 5,
				},
				{
					id: 2,
					slug: "新しいタグ",
					createdAt: "2024-01-10T00:00:00.000Z",
					updatedAt: "2024-01-11T00:00:00.000Z",
					articleCount: 3,
				},
			];

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						groupBy: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(mockTags),
						}),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get();

			// Assert
			expect(res.status).toBe(200);
			const _data = await res.json();

			// orderByが呼ばれたことを確認
			expect(
				tagListMock.from().leftJoin().groupBy().orderBy
			).toHaveBeenCalled();
		});
	});
});
