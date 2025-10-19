import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// 翻訳サービスのモック
const mockTranslateTag = vi.fn();
vi.mock("@/services/gemini-translation/gemini-translation", () => ({
	createTranslationService: vi.fn(() => ({
		translateTag: mockTranslateTag,
	})),
}));

// getDatabase関数のモック
vi.mock("@/lib/database", () => ({
	getDatabase: vi.fn(),
}));

describe("PUT /tags/:id - タグ更新", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Integration Test", () => {
		it("タグを正常に更新する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
			});

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
			const updateTagMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdatedTag]),
					}),
				}),
			};

			// tag_translations更新のモック
			const updateTranslationMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingTagMock) // 既存タグ確認
				.mockReturnValueOnce(duplicateMock); // 重複チェック

			mockDb.update
				.mockReturnValueOnce(updateTagMock) // タグ更新
				.mockReturnValueOnce(updateTranslationMock); // 日本語翻訳更新（GEMINI_API_KEYがないので英語はスキップ）

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { name: "タイプスクリプト", slug: "typescript" },
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

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
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
			const res = await client[":id"].$put({
				param: { id: "999" },
				json: { name: "タイプスクリプト", slug: "typescript" },
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
				tagTranslations: {},
			});

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "invalid" },
				json: { name: "タイプスクリプト", slug: "typescript" },
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

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
			});

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
				json: { name: "タイプスクリプト", slug: "typescript" },
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

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
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
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { name: "タイプスクリプト", slug: "typescript" },
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

		it("翻訳機能: GEMINI_API_KEYが設定されている場合、日本語と英語の翻訳を更新する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
			});

			// 翻訳が成功する場合のモック
			mockTranslateTag.mockResolvedValue("typescript");

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

			// タグ更新のモック
			const updateTagMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdatedTag]),
					}),
				}),
			};

			// tag_translations更新のモック（2回呼ばれる: 日本語と英語）
			const updateTranslationMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingTagMock) // 既存タグ確認
				.mockReturnValueOnce(duplicateMock); // 重複チェック

			mockDb.update
				.mockReturnValueOnce(updateTagMock) // タグ更新
				.mockReturnValueOnce(updateTranslationMock) // 日本語翻訳更新
				.mockReturnValueOnce(updateTranslationMock); // 英語翻訳更新

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { name: "タイプスクリプト", slug: "typescript" },
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.message).toBe("タグが正常に更新されました");

			// タグ更新とtag_translations更新が呼ばれたことを確認
			expect(mockDb.update).toHaveBeenCalledTimes(3); // tag + ja translation + en translation
		});

		it("翻訳機能: GEMINI_API_KEYが設定されていない場合、日本語の翻訳のみ更新する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
			});

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

			const existingTagMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(mockExistingTag),
					}),
				}),
			};

			const duplicateMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const updateTagMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdatedTag]),
					}),
				}),
			};

			const updateTranslationMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingTagMock)
				.mockReturnValueOnce(duplicateMock);

			mockDb.update
				.mockReturnValueOnce(updateTagMock) // タグ更新
				.mockReturnValueOnce(updateTranslationMock); // 日本語翻訳のみ

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				// GEMINI_API_KEY未設定
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { name: "タイプスクリプト", slug: "typescript" },
			});

			// Assert
			expect(res.status).toBe(200);

			// タグ更新と日本語翻訳のみ
			expect(mockDb.update).toHaveBeenCalledTimes(2); // tag + ja translation only
		});

		it("翻訳機能: enNameを手動指定した場合、自動翻訳をスキップして手動指定された英語名を使用する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
			});

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

			const existingTagMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(mockExistingTag),
					}),
				}),
			};

			const duplicateMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const updateTagMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdatedTag]),
					}),
				}),
			};

			const updateTranslationMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingTagMock)
				.mockReturnValueOnce(duplicateMock);

			mockDb.update
				.mockReturnValueOnce(updateTagMock) // タグ更新
				.mockReturnValueOnce(updateTranslationMock) // 日本語翻訳更新
				.mockReturnValueOnce(updateTranslationMock); // 英語翻訳更新（手動指定）

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key", // APIキーがあっても手動指定が優先される
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: {
					name: "タイプスクリプト",
					enName: "TypeScript", // 手動指定
					slug: "typescript",
				},
			});

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.message).toBe("タグが正常に更新されました");

			// 自動翻訳が呼ばれていないことを確認
			expect(mockTranslateTag).not.toHaveBeenCalled();

			// タグ更新と両方の翻訳更新が呼ばれたことを確認
			expect(mockDb.update).toHaveBeenCalledTimes(3); // tag + ja translation + en translation
		});

		it("翻訳機能: 翻訳が失敗しても日本語の翻訳は更新され、処理は続行される", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				tags: {},
				tagTranslations: {},
			});

			// 翻訳が失敗する場合のモック
			mockTranslateTag.mockResolvedValue(null);

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

			const existingTagMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(mockExistingTag),
					}),
				}),
			};

			const duplicateMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			const updateTagMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdatedTag]),
					}),
				}),
			};

			const updateTranslationMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(existingTagMock)
				.mockReturnValueOnce(duplicateMock);

			mockDb.update
				.mockReturnValueOnce(updateTagMock) // タグ更新
				.mockReturnValueOnce(updateTranslationMock); // 日本語翻訳

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
				GEMINI_API_KEY: "test-gemini-key",
			}) as any;
			const res = await client[":id"].$put({
				param: { id: "1" },
				json: { name: "タイプスクリプト", slug: "typescript" },
			});

			// Assert
			expect(res.status).toBe(200);

			// 翻訳が失敗しても、タグ更新と日本語翻訳は成功
			expect(mockDb.update).toHaveBeenCalled();
		});
	});
});
