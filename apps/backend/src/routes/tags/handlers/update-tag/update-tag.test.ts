import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// モック設定
vi.mock("@saneatsu/db/worker", () => ({
	tags: {},
	createDatabaseClient: vi.fn(),
}));

describe("PUT /tags/:id - タグ更新", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Integration Test", () => {
		it("タグを正常に更新する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// createDatabaseClient関数がmockDbを返すように設定
			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockExistingTag = [
				{
					id: 1,
					slug: "javascript",
				},
			];

			const mockUpdatedTag = {
				id: 1,
				slug: "typescript",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
			};

			// 既存タグ取得のモック
			const existingTagMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(mockExistingTag),
					}),
				}),
			};

			// 重複チェックのモック（重複なし）
			const duplicateMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			// 更新のモック
			const updateMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdatedTag]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingTagMock) // 既存タグ確認
				.mockReturnValueOnce(duplicateMock); // 重複チェック

			mockDb.update.mockReturnValueOnce(updateMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { slug: "typescript" },
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data).toEqual({
				data: mockUpdatedTag,
				message: "タグが正常に更新されました",
			});
		});

		it("存在しないタグで404エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
			const res = await client[":id"].$put({
				param: { id: "999" },
				json: { slug: "typescript" },
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

			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "invalid" },
				json: { slug: "typescript" },
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

		it("スラッグ重複: 他のタグと重複する場合409エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockExistingTag = [
				{
					id: 1,
					slug: "javascript",
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

			// 重複チェックのモック（重複あり）
			const duplicateMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([{ id: 2 }]),
					}),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingTagMock) // 既存タグ確認
				.mockReturnValueOnce(duplicateMock); // 重複チェック

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { slug: "typescript" },
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

		it("DBエラー: データベースエラーの場合500エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db/worker");
			(createDatabaseClient as any).mockReturnValue(mockDb);

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
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { slug: "typescript" },
			});

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();

			expect(data).toEqual({
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update tag",
				},
			});
		});
	});
});
