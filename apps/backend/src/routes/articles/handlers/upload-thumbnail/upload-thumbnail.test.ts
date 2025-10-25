import { beforeEach, describe, expect, it, vi } from "vitest";

import { articlesRoute } from "@/routes/articles";
import type { Env } from "@/types/env";
import { setupDbMocks } from "@/utils/drizzle-test";

// Cloudflare Imagesモジュールのモック
const { mockUploadImage, mockDeleteImage, mockGetImageUrl } = vi.hoisted(
	() => ({
		mockUploadImage: vi.fn(),
		mockDeleteImage: vi.fn(),
		mockGetImageUrl: vi.fn(),
	})
);

vi.mock("@/lib/cloudflare-images/cloudflare-images", () => ({
	uploadImage: mockUploadImage,
	deleteImage: mockDeleteImage,
	getImageUrl: mockGetImageUrl,
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
	NODE_ENV: "development",
};

describe("ユニットテスト", () => {
	describe("POST /articles/:id/thumbnail - サムネイル画像アップロード", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("サムネイル画像を正常にアップロードする（既存画像なし）", async () => {
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

			// Update記事のモック
			const updateArticleMock = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue({}),
				}),
			};

			mockDb.select.mockReturnValue(selectArticleMock as any);
			mockDb.update.mockReturnValue(updateArticleMock as any);

			// Cloudflare Imagesのモック（CustomImageId形式、開発環境）
			const mockCustomId =
				"saneatsu-me_development_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
			mockUploadImage.mockResolvedValue({
				imageId: mockCustomId,
			});
			mockGetImageUrl.mockReturnValue(
				`https://imagedelivery.net/test-hash/${mockCustomId}/medium`
			);

			// Act
			const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/1/thumbnail", {
				method: "POST",
				body: formData,
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				imageId: mockCustomId,
				imageUrl: `https://imagedelivery.net/test-hash/${mockCustomId}/medium`,
				message: "サムネイル画像が正常にアップロードされました",
			});

			// 古い画像の削除は呼ばれない
			expect(mockDeleteImage).not.toHaveBeenCalled();

			// アップロードが呼ばれる（thumbnailプレフィックス付き、環境変数含む）
			expect(mockUploadImage).toHaveBeenCalledWith(
				expect.any(File),
				expect.objectContaining({
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
					NODE_ENV: "development",
				}),
				{ prefix: "thumbnail" }
			);

			// DBの更新が呼ばれる
			expect(updateArticleMock.set).toHaveBeenCalledWith({
				cfImageId: mockCustomId,
				updatedAt: expect.any(String),
			});
		});

		it("サムネイル画像を正常にアップロードする（既存画像あり）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: "old-image-id",
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

			// Cloudflare Imagesのモック（CustomImageId形式、開発環境）
			const mockNewCustomId =
				"saneatsu-me_development_thumbnail_3edd39f1-128b-40d5-9fe8-98167d94012f";
			mockDeleteImage.mockResolvedValue({ success: true });
			mockUploadImage.mockResolvedValue({
				imageId: mockNewCustomId,
			});
			mockGetImageUrl.mockReturnValue(
				`https://imagedelivery.net/test-hash/${mockNewCustomId}/medium`
			);

			// Act
			const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/1/thumbnail", {
				method: "POST",
				body: formData,
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				imageId: mockNewCustomId,
				imageUrl: `https://imagedelivery.net/test-hash/${mockNewCustomId}/medium`,
				message: "サムネイル画像が正常にアップロードされました",
			});

			// 古い画像の削除が呼ばれる
			expect(mockDeleteImage).toHaveBeenCalledWith("old-image-id", {
				CLOUDFLARE_ACCOUNT_ID: "test-account-id",
				CLOUDFLARE_API_TOKEN: "test-token",
			});

			// 新しい画像のアップロードが呼ばれる（thumbnailプレフィックス付き、環境変数含む）
			expect(mockUploadImage).toHaveBeenCalledWith(
				expect.any(File),
				expect.objectContaining({
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
					NODE_ENV: "development",
				}),
				{ prefix: "thumbnail" }
			);
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
			const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/999/thumbnail", {
				method: "POST",
				body: formData,
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

			// アップロードは呼ばれない
			expect(mockUploadImage).not.toHaveBeenCalled();
		});

		it("ファイルが指定されていない場合、400エラーを返す", async () => {
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
			const formData = new FormData();
			// fileを追加しない

			const req = new Request("http://localhost/1/thumbnail", {
				method: "POST",
				body: formData,
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "INVALID_REQUEST",
					message:
						"ファイルが指定されていません。multipart/form-dataでfileフィールドに画像を指定してください。",
				},
			});

			// アップロードは呼ばれない
			expect(mockUploadImage).not.toHaveBeenCalled();
		});

		it("Cloudflare Images APIエラー時、500エラーを返す", async () => {
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

			// Cloudflare Imagesのモック（エラー）
			mockUploadImage.mockRejectedValue(
				new Error("Cloudflare Images upload failed: 500 Internal Server Error")
			);

			// Act
			const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/1/thumbnail", {
				method: "POST",
				body: formData,
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "UPLOAD_FAILED",
					message: "サムネイル画像のアップロードに失敗しました",
				},
			});
		});
	});
});
