import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// getDatabase関数のモック
vi.mock("@/lib/database", () => ({
	getDatabase: vi.fn(),
}));

describe("GET /tags - タグ一覧取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Integration Test", () => {
		it("タグ一覧を正常に取得する（記事カウントも含む）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

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

			// タグ一覧取得のモック（LEFT JOIN → LEFT JOIN → $dynamic → GROUP BY → ORDER BY）
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック（空配列を返す）
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock) // タグ一覧取得
				.mockReturnValueOnce(translationsMock); // 翻訳データ取得

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
			expect(data.data[0]).toEqual({
				...mockTags[0],
				translations: { ja: null, en: null },
			});
			expect(data.data[1]).toEqual({
				...mockTags[1],
				translations: { ja: null, en: null },
			});
			expect(data.data[0].articleCount).toBe(5);
			expect(data.data[1].articleCount).toBe(3);
		});

		it("タグが存在しない場合、空の配列を返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue([]),
							}),
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

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

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
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック（空配列を返す）
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock) // タグ一覧取得
				.mockReturnValueOnce(translationsMock); // 翻訳データ取得

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

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

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

		it("タグが更新日時の降順でソートされる（最新のものが上）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			// 更新日の降順でソート（最新のものが先）
			const mockTags = [
				{
					id: 2,
					slug: "新しいタグ",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-11T00:00:00.000Z",
					articleCount: 3,
				},
				{
					id: 1,
					slug: "古いタグ",
					createdAt: "2024-01-10T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 5,
				},
			];

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック（空配列を返す）
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock) // タグ一覧取得
				.mockReturnValueOnce(translationsMock); // 翻訳データ取得

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
				tagListMock.from().leftJoin().leftJoin().groupBy().orderBy
			).toHaveBeenCalled();
		});

		it("翻訳機能: 日本語と英語の翻訳を含むタグ一覧を取得する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			// タグデータ（translationsなし）
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

			// 翻訳データのモック
			const mockTranslations = [
				{ tagId: 1, language: "ja", name: "タイプスクリプト" },
				{ tagId: 1, language: "en", name: "TypeScript" },
				{ tagId: 2, language: "ja", name: "ジャバスクリプト" },
				{ tagId: 2, language: "en", name: "JavaScript" },
			];

			// タグ一覧取得のモック（LEFT JOIN → LEFT JOIN → $dynamic → GROUP BY → ORDER BY）
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock) // タグ一覧取得
				.mockReturnValueOnce(translationsMock); // 翻訳データ取得

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
			expect(data.data[0]).toEqual({
				...mockTags[0],
				translations: {
					ja: "タイプスクリプト",
					en: "TypeScript",
				},
			});
			expect(data.data[1]).toEqual({
				...mockTags[1],
				translations: {
					ja: "ジャバスクリプト",
					en: "JavaScript",
				},
			});
		});

		it("翻訳機能: 翻訳データが存在しないタグでも正常に動作する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			// タグデータ（translationsなし）
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
					slug: "new-tag",
					createdAt: "2024-01-03T00:00:00.000Z",
					updatedAt: "2024-01-04T00:00:00.000Z",
					articleCount: 1,
				},
			];

			// 翻訳データのモック（タグ1のみ翻訳あり）
			const mockTranslations = [
				{ tagId: 1, language: "ja", name: "タイプスクリプト" },
				{ tagId: 1, language: "en", name: "TypeScript" },
			];

			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック（タグ1のみ）
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock) // タグ一覧取得
				.mockReturnValueOnce(translationsMock); // 翻訳データ取得

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
			expect(data.data[0]).toEqual({
				...mockTags[0],
				translations: {
					ja: "タイプスクリプト",
					en: "TypeScript",
				},
			});
			expect(data.data[1]).toEqual({
				...mockTags[1],
				translations: {
					ja: null,
					en: null,
				},
			});
		});

		it("status=published でリクエストした場合、公開記事のみがカウントされる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			// 公開記事のみの数がカウントされたタグデータ
			const mockTags = [
				{
					id: 1,
					slug: "typescript",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 5, // 公開記事のみ
				},
			];

			// タグ一覧取得のモック（articlesテーブルjoin追加、$dynamic()、where追加）
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							where: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock) // タグ一覧取得
				.mockReturnValueOnce(translationsMock); // 翻訳データ取得

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get({ query: { status: "published" } });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.data).toHaveLength(1);
			expect(data.data[0].articleCount).toBe(5);
			// where句が呼ばれたことを確認（statusでフィルタリング）
			expect(tagListMock.from().leftJoin().leftJoin().where).toHaveBeenCalled();
		});

		it("status=draft でリクエストした場合、下書き記事のみがカウントされる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			// 下書き記事のみの数がカウントされたタグデータ
			const mockTags = [
				{
					id: 1,
					slug: "typescript",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 3, // 下書き記事のみ
				},
			];

			// タグ一覧取得のモック
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							where: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock)
				.mockReturnValueOnce(translationsMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get({ query: { status: "draft" } });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.data).toHaveLength(1);
			expect(data.data[0].articleCount).toBe(3);
			expect(tagListMock.from().leftJoin().leftJoin().where).toHaveBeenCalled();
		});

		it("status=archived でリクエストした場合、アーカイブ記事のみがカウントされる", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			// アーカイブ記事のみの数がカウントされたタグデータ
			const mockTags = [
				{
					id: 1,
					slug: "typescript",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 2, // アーカイブ記事のみ
				},
			];

			// タグ一覧取得のモック
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							where: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock)
				.mockReturnValueOnce(translationsMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get({ query: { status: "archived" } });

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.data).toHaveLength(1);
			expect(data.data[0].articleCount).toBe(2);
			expect(tagListMock.from().leftJoin().leftJoin().where).toHaveBeenCalled();
		});

		it("statusパラメータなしでリクエストした場合、全ステータスの記事がカウントされる（後方互換性）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			// getDatabase関数がmockDbとスキーマを返すように設定
			const { getDatabase } = await import("@/lib/database");
			(getDatabase as any).mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue(mockDb),
				articles: {},
				articleTags: {},
				tags: {},
				tagTranslations: {},
			});

			// 全ステータスの記事がカウントされたタグデータ
			const mockTags = [
				{
					id: 1,
					slug: "typescript",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
					articleCount: 10, // published(5) + draft(3) + archived(2)
				},
			];

			// タグ一覧取得のモック
			const tagListMock = {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnThis(),
							where: vi.fn().mockReturnThis(),
							groupBy: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockTags),
							}),
						}),
					}),
				}),
			};

			// 翻訳データ取得のモック
			const translationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			mockDb.select
				.mockReturnValueOnce(tagListMock)
				.mockReturnValueOnce(translationsMock);

			// Act
			const client = testClient(tagsRoute, {
				TURSO_DATABASE_URL: "test://test.db",
				TURSO_AUTH_TOKEN: "test-token",
			}) as any;
			const res = await client.index.$get(); // statusパラメータなし

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.data).toHaveLength(1);
			expect(data.data[0].articleCount).toBe(10);
			// where句が呼ばれていないことを確認（statusでフィルタリングされていない）
			expect(
				tagListMock.from().leftJoin().leftJoin().where
			).not.toHaveBeenCalled();
		});
	});
});
