import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// モック設定
vi.mock("@saneatsu/db/worker", () => ({
	tags: {},
	createDatabaseClient: vi.fn(),
}));

describe("POST /tags - タグ作成", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグを正常に作成する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const mockNewTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		// Insertタグのモック
		const insertTagMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockNewTag]),
			}),
		};

		// 既存タグチェック用のモック
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 既存タグなし
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock); // 既存タグチェック
		mockDb.insert.mockReturnValueOnce(insertTagMock); // タグ作成

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);
		const data = await res.json();

		expect(data).toEqual({
			data: mockNewTag,
			message: "タグが正常に作成されました",
		});

		expect(mockDb.insert).toHaveBeenCalledTimes(1);
		expect(mockDb.select).toHaveBeenCalledTimes(1);
	});

	it("バリデーションエラー: スラッグが空の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				slug: "",
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
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				slug: "Invalid Slug With Spaces!",
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});

	it("重複エラー: 既存のスラッグの場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const existingTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		// 既存タグチェック用のモック
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([existingTag]), // 既存タグあり
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock); // 既存タグチェック

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				slug: "typescript",
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

		expect(mockDb.insert).not.toHaveBeenCalled();
		expect(mockDb.select).toHaveBeenCalledTimes(1);
	});

	it("DBエラー: データベースエラーの場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// DBエラーをシミュレート
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockRejectedValue(new Error("Database error")),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(500);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "DATABASE_ERROR",
				message: "Failed to create tag",
			},
		});
	});
});
