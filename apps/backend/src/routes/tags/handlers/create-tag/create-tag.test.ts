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

describe("POST /tags - タグ作成", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグを正常に作成する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

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

		// Insert tag_translation のモック
		const insertTranslationMock = {
			values: vi.fn().mockResolvedValue(undefined),
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
		mockDb.insert
			.mockReturnValueOnce(insertTagMock) // タグ作成
			.mockReturnValueOnce(insertTranslationMock); // 日本語翻訳（GEMINI_API_KEYがないので英語翻訳はスキップ）

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
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

		expect(mockDb.insert).toHaveBeenCalledTimes(2); // tag + ja translation
		expect(mockDb.select).toHaveBeenCalledTimes(1);
	});

	it("バリデーションエラー: タグ名が空の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
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
		const res = await client.index.$post({
			json: {
				name: "",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});

	it("バリデーションエラー: スラッグが空の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
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
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
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

		// getDatabase関数がmockDbとスキーマを返すように設定
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
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
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

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

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
				name: "タイプスクリプト",
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

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

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
				name: "タイプスクリプト",
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

	it("翻訳機能: GEMINI_API_KEYが設定されている場合、日本語と英語の翻訳を作成する", async () => {
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

		const mockNewTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		// タグ作成のモック
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

		// tag_translations挿入用のモック（2回呼ばれる: 日本語と英語）
		const insertTranslationMock = {
			values: vi.fn().mockResolvedValue(undefined),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock);
		mockDb.insert
			.mockReturnValueOnce(insertTagMock) // タグ作成
			.mockReturnValueOnce(insertTranslationMock) // 日本語翻訳
			.mockReturnValueOnce(insertTranslationMock); // 英語翻訳

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "test-gemini-key",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);
		const data = await res.json();

		expect(data.message).toBe("タグが正常に作成されました");

		// タグ作成とtag_translations挿入が呼ばれたことを確認
		expect(mockDb.insert).toHaveBeenCalledTimes(3); // tag + ja translation + en translation
	});

	it("翻訳機能: GEMINI_API_KEYが設定されていない場合、日本語の翻訳のみ作成する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		const mockNewTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const insertTagMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockNewTag]),
			}),
		};

		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		const insertTranslationMock = {
			values: vi.fn().mockResolvedValue(undefined),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock);
		mockDb.insert
			.mockReturnValueOnce(insertTagMock) // タグ作成
			.mockReturnValueOnce(insertTranslationMock); // 日本語翻訳のみ

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			// GEMINI_API_KEY未設定
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// タグ作成と日本語翻訳のみ
		expect(mockDb.insert).toHaveBeenCalledTimes(2); // tag + ja translation only
	});

	it("翻訳機能: 翻訳が失敗しても日本語の翻訳は作成され、処理は続行される", async () => {
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

		const mockNewTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const insertTagMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockNewTag]),
			}),
		};

		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		const insertTranslationMock = {
			values: vi.fn().mockResolvedValue(undefined),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock);
		mockDb.insert
			.mockReturnValueOnce(insertTagMock) // タグ作成
			.mockReturnValueOnce(insertTranslationMock); // 日本語翻訳

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "test-gemini-key",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// 翻訳が失敗しても、タグ作成と日本語翻訳は成功
		// (実装では翻訳エラーをキャッチして処理を続行する想定)
		expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
	});
});
