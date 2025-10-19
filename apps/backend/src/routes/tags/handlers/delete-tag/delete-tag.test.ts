import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// getDatabase関数のモック
vi.mock("@/lib/database", () => ({
	getDatabase: vi.fn(),
}));

describe("DELETE /tags/:id - タグ削除", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Integration Test", () => {
		it("タグを正常に削除する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			const mockExistingTag = [
				{
					id: 1,
				},
			];

			// 既存タグ取得のモック
			const existingTagMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(mockExistingTag),
					}),
				}),
			};

			// 削除のモック
			const deleteMock = {
				where: vi.fn().mockResolvedValue(undefined),
			};

			mockDb.select.mockReturnValueOnce(existingTagMock);
			mockDb.delete.mockReturnValueOnce(deleteMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$delete({
				param: { id: "1" },
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data).toEqual({
				message: "タグが正常に削除されました",
			});
		});

		it("存在しないタグで404エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			// 既存タグが存在しない
			const existingTagMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(existingTagMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$delete({
				param: { id: "999" },
			});

			// Assert
			expect(res.status).toBe(404);
			const data = await res.json();

			expect(data).toEqual({
				error: {
					code: "NOT_FOUND",
					message: "Tag not found",
				},
			});
		});

		it("無効なIDで400エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$delete({
				param: { id: "invalid" },
			});

			// Assert
			expect(res.status).toBe(400);
			const data = await res.json();

			expect(data).toEqual({
				error: {
					code: "INVALID_ID",
					message: "Invalid tag ID",
				},
			});
		});

		it("DBエラー: データベースエラーの場合500エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
			});

			// データベースエラーをシミュレート
			const existingTagMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			};

			mockDb.select.mockReturnValueOnce(existingTagMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$delete({
				param: { id: "1" },
			});

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();

			expect(data).toEqual({
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to delete tag",
				},
			});
		});
	});
});
