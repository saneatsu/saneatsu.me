import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// getDatabase関数のモック
vi.mock("@/lib/database", () => ({
	getDatabase: vi.fn(),
}));

describe("GET /tags/suggestions - タグサジェスト取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Integration Test", () => {
		it("クエリなしで全タグから最大10件を取得する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			const mockTags = [
				{ id: 1, slug: "typescript" },
				{ id: 2, slug: "javascript" },
				{ id: 3, slug: "react" },
			];

			// タグ取得のモック
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(mockTags),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({ query: {} });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.suggestions).toHaveLength(3);
			expect(data.suggestions[0]).toEqual({
				id: 1,
				slug: "typescript",
				name: "typescript",
				type: "tag",
			});
			expect(data.suggestions[1]).toEqual({
				id: 2,
				slug: "javascript",
				name: "javascript",
				type: "tag",
			});
			expect(data.suggestions[2]).toEqual({
				id: 3,
				slug: "react",
				name: "react",
				type: "tag",
			});
		});

		it("クエリありで部分一致検索を実行する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			const mockTags = [
				{ id: 1, slug: "typescript" },
				{ id: 2, slug: "javascript" },
			];

			// タグ検索のモック（LIKE検索）
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(mockTags),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({ query: { q: "script" } });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.suggestions).toHaveLength(2);
			expect(data.suggestions[0].slug).toBe("typescript");
			expect(data.suggestions[1].slug).toBe("javascript");

			// where句が呼ばれたことを確認（LIKE検索）
			expect(tagListMock.from().where).toHaveBeenCalled();
		});

		it("マッチするタグが存在しない場合は空配列を返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			// タグ検索のモック（マッチなし）
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({
				query: { q: "nonexistent" },
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data).toEqual({
				suggestions: [],
			});
		});

		it("タグが存在しない場合（クエリなし）も空配列を返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({ query: {} });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data).toEqual({
				suggestions: [],
			});
		});

		it("結果が10件に制限される", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			// 10件のタグを生成
			const mockTags = Array.from({ length: 10 }, (_, i) => ({
				id: i + 1,
				slug: `tag-${i + 1}`,
			}));

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(mockTags),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({ query: {} });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.suggestions).toHaveLength(10);
			// limit(10)が呼ばれたことを確認
			expect(tagListMock.from().limit).toHaveBeenCalledWith(10);
		});

		it("空白のみのクエリは空のクエリとして扱われる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			const mockTags = [{ id: 1, slug: "typescript" }];

			// タグ取得のモック（WHERE句なし）
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(mockTags),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({ query: { q: "   " } });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.suggestions).toHaveLength(1);
			// WHERE句が呼ばれていないことを確認（空白は空クエリ扱い）
			expect(tagListMock.from).toHaveBeenCalled();
		});

		it("データベースエラーの場合、500エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			// データベースエラーをシミュレート
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					limit: vi
						.fn()
						.mockRejectedValue(new Error("Database connection failed")),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({ query: {} });

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();

			expect(data).toEqual({
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tag suggestions",
				},
			});
		});

		it("idがnullの場合は0として返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			const mockTags = [{ id: null, slug: "typescript" }];

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(mockTags),
				}),
			};

			mockDb.select.mockReturnValueOnce(tagListMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.suggestions.$get({ query: {} });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.suggestions[0]).toEqual({
				id: 0,
				slug: "typescript",
				name: "typescript",
				type: "tag",
			});
		});
	});
});
