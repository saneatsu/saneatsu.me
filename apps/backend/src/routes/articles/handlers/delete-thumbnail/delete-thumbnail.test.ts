import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "@/env";
import { articlesRoute } from "@/routes/articles";
import { setupDbMocks } from "@/utils/drizzle-test";

// Cloudflare Imagesモジュールのモック
const { mockDeleteImage } = vi.hoisted(() => ({
	mockDeleteImage: vi.fn(),
}));

vi.mock("@/lib/cloudflare-images/cloudflare-images", () => ({
	deleteImage: mockDeleteImage,
}));

// DBモック設定
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

const mockEnv: Env = {
	TURSO_DATABASE_URL: "test-db-url",
	TURSO_AUTH_TOKEN: "test-auth-token",
	CLOUDFLARE_ACCOUNT_ID: "test-account-id",
	CLOUDFLARE_API_TOKEN: "test-token",
	CLOUDFLARE_ACCOUNT_HASH: "test-hash",
	GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
	MAPBOX_ACCESS_TOKEN: "test-mapbox-token",
	NODE_ENV: "development",
};

describe("ユニットテスト", () => {
	describe("DELETE /articles/:id/thumbnail - サムネイル画像削除", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("サムネイル画像を正常に削除する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: "existing-image-id",
			};

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			// Update記事のモック
			const updateArticleMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue({}),
				}),
			};

			mockDb.select.mockReturnValue(selectArticleMock as any);
			mockDb.update.mockReturnValue(updateArticleMock as any);

			// Cloudflare Imagesのモック
			mockDeleteImage.mockResolvedValue({ success: true });

			// Act
			const req = new Request("http://localhost/1/thumbnail", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "サムネイル画像が正常に削除されました",
			});

			// 画像の削除が呼ばれる
			expect(mockDeleteImage).toHaveBeenCalledWith("existing-image-id", {
				CLOUDFLARE_ACCOUNT_ID: "test-account-id",
				CLOUDFLARE_API_TOKEN: "test-token",
			});

			// DBの更新が呼ばれる
			expect(updateArticleMock.set).toHaveBeenCalledWith({
				cfImageId: null,
				updatedAt: expect.any(String),
			});
		});

		it("記事が存在しない場合、404エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			// Select記事のモック（記事が見つからない）
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};

			mockDb.select.mockReturnValue(selectArticleMock as any);

			// Act
			const req = new Request("http://localhost/999/thumbnail", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "NOT_FOUND",
					message: "指定された記事が見つかりません",
				},
			});

			// 削除は呼ばれない
			expect(mockDeleteImage).not.toHaveBeenCalled();
		});

		it("cfImageIdがnullの場合、404エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: null,
			};

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			mockDb.select.mockReturnValue(selectArticleMock as any);

			// Act
			const req = new Request("http://localhost/1/thumbnail", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "NOT_FOUND",
					message: "削除するサムネイル画像が存在しません",
				},
			});

			// 削除は呼ばれない
			expect(mockDeleteImage).not.toHaveBeenCalled();
		});

		it("Cloudflare Images APIエラー時、500エラーを返す", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: "existing-image-id",
			};

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			mockDb.select.mockReturnValue(selectArticleMock as any);

			// Cloudflare Imagesのモック（エラー）
			mockDeleteImage.mockRejectedValue(
				new Error("Cloudflare Images delete failed: 500 Internal Server Error")
			);

			// Act
			const req = new Request("http://localhost/1/thumbnail", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "DELETE_FAILED",
					message: "サムネイル画像の削除に失敗しました",
				},
			});
		});
	});
});
