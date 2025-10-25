import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "@/env";
import { articlesRoute } from "@/routes/articles";
import { setupDbMocks } from "@/utils/drizzle-test";

// Cloudflare Imagesモジュールのモック
const { mockDeleteImage } = vi.hoisted(() => ({
	mockDeleteImage: vi.fn(),
}));

// extract-image-idsモジュールのモック
const { mockExtractImageIdsFromMarkdown } = vi.hoisted(() => ({
	mockExtractImageIdsFromMarkdown: vi.fn(),
}));

vi.mock("@/lib/cloudflare-images/cloudflare-images", () => ({
	deleteImage: mockDeleteImage,
}));

vi.mock("@/lib/extract-image-ids/extract-image-ids", () => ({
	extractImageIdsFromMarkdown: mockExtractImageIdsFromMarkdown,
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
	describe("DELETE /articles/:id - 記事削除", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("記事を正常に削除する（サムネイルなし、Markdown内画像なし）", async () => {
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

			// Select翻訳のモック（空配列）
			const selectTranslationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			// Delete記事のモック
			const deleteArticleMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			// 最初のselectは記事、2回目のselectは翻訳
			mockDb.select
				.mockReturnValueOnce(selectArticleMock as any)
				.mockReturnValueOnce(selectTranslationsMock as any);
			mockDb.delete.mockReturnValue(deleteArticleMock as any);

			// extractImageIdsFromMarkdownは呼ばれない（翻訳データが空）

			// Act
			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "記事が正常に削除されました",
			});

			// 画像削除は呼ばれない
			expect(mockDeleteImage).not.toHaveBeenCalled();

			// 記事削除が呼ばれる
			expect(deleteArticleMock.where).toHaveBeenCalled();
		});

		it("記事を正常に削除する（サムネイルあり、Markdown内画像なし）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f",
			};

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			// Select翻訳のモック（空配列）
			const selectTranslationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			// Delete記事のモック
			const deleteArticleMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock as any)
				.mockReturnValueOnce(selectTranslationsMock as any);
			mockDb.delete.mockReturnValue(deleteArticleMock as any);

			// サムネイル削除のモック
			mockDeleteImage.mockResolvedValue({ success: true });

			// Act
			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "記事が正常に削除されました",
			});

			// サムネイル削除が呼ばれる
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);
			// 1回だけ呼ばれる
			expect(mockDeleteImage).toHaveBeenCalledTimes(1);

			// 記事削除が呼ばれる
			expect(deleteArticleMock.where).toHaveBeenCalled();
		});

		it("記事を正常に削除する（サムネイルなし、Markdown内画像あり）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: null,
			};

			const mockTranslations = [
				{
					content:
						"![画像1](https://imagedelivery.net/test-hash/saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f/medium)",
				},
			];

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			// Select翻訳のモック
			const selectTranslationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			};

			// Delete記事のモック
			const deleteArticleMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock as any)
				.mockReturnValueOnce(selectTranslationsMock as any);
			mockDb.delete.mockReturnValue(deleteArticleMock as any);

			// extractImageIdsFromMarkdownのモック
			mockExtractImageIdsFromMarkdown.mockReturnValue([
				"saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f",
			]);

			// コンテンツ画像削除のモック
			mockDeleteImage.mockResolvedValue({ success: true });

			// Act
			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "記事が正常に削除されました",
			});

			// extractImageIdsFromMarkdownが呼ばれる
			expect(mockExtractImageIdsFromMarkdown).toHaveBeenCalledWith(
				mockTranslations[0].content
			);

			// コンテンツ画像削除が呼ばれる
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);
			// 1回だけ呼ばれる（サムネイルなし、コンテンツ画像1つ）
			expect(mockDeleteImage).toHaveBeenCalledTimes(1);

			// 記事削除が呼ばれる
			expect(deleteArticleMock.where).toHaveBeenCalled();
		});

		it("記事を正常に削除する（サムネイルあり、Markdown内画像あり・複数）", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f",
			};

			const mockTranslations = [
				{
					content:
						"![画像1](https://imagedelivery.net/test-hash/saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f/medium)\n![画像2](https://imagedelivery.net/test-hash/saneatsu-me_content_4fee40a2-239c-41e6-8af9-09278e05013a/medium)",
				},
				{
					content:
						"![画像3](https://imagedelivery.net/test-hash/saneatsu-me_content_5aff51b3-340d-42f7-9ba0-10389f16024b/medium)",
				},
			];

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			// Select翻訳のモック
			const selectTranslationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			};

			// Delete記事のモック
			const deleteArticleMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock as any)
				.mockReturnValueOnce(selectTranslationsMock as any);
			mockDb.delete.mockReturnValue(deleteArticleMock as any);

			// extractImageIdsFromMarkdownのモック（各翻訳ごとに呼ばれる）
			mockExtractImageIdsFromMarkdown
				.mockReturnValueOnce([
					"saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f",
					"saneatsu-me_content_4fee40a2-239c-41e6-8af9-09278e05013a",
				])
				.mockReturnValueOnce([
					"saneatsu-me_content_5aff51b3-340d-42f7-9ba0-10389f16024b",
				]);

			// 画像削除のモック（サムネイル + コンテンツ画像3つ = 4回）
			mockDeleteImage.mockResolvedValue({ success: true });

			// Act
			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "記事が正常に削除されました",
			});

			// extractImageIdsFromMarkdownが2回呼ばれる
			expect(mockExtractImageIdsFromMarkdown).toHaveBeenCalledTimes(2);

			// サムネイル削除が呼ばれる
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);

			// コンテンツ画像削除が呼ばれる（3つ）
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_content_4fee40a2-239c-41e6-8af9-09278e05013a",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_content_5aff51b3-340d-42f7-9ba0-10389f16024b",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);

			// 合計4回呼ばれる（サムネイル1 + コンテンツ3）
			expect(mockDeleteImage).toHaveBeenCalledTimes(4);

			// 記事削除が呼ばれる
			expect(deleteArticleMock.where).toHaveBeenCalled();
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
			const req = new Request("http://localhost/999", {
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

			// 画像削除は呼ばれない
			expect(mockDeleteImage).not.toHaveBeenCalled();
			// 記事削除も呼ばれない
			expect(mockDb.delete).not.toHaveBeenCalled();
		});

		it("サムネイル画像削除失敗時でも、記事削除は成功する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f",
			};

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			// Select翻訳のモック（空配列）
			const selectTranslationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			// Delete記事のモック
			const deleteArticleMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock as any)
				.mockReturnValueOnce(selectTranslationsMock as any);
			mockDb.delete.mockReturnValue(deleteArticleMock as any);

			// サムネイル削除が失敗する
			mockDeleteImage.mockRejectedValue(
				new Error("Cloudflare Images delete failed")
			);

			// console.errorをモック
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			// Act
			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "記事が正常に削除されました",
			});

			// サムネイル削除が呼ばれた
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);

			// エラーがログ出力された
			expect(consoleErrorSpy).toHaveBeenCalled();

			// 記事削除は成功する
			expect(deleteArticleMock.where).toHaveBeenCalled();

			// cleanup
			consoleErrorSpy.mockRestore();
		});

		it("コンテンツ画像削除失敗時でも、記事削除は成功する", async () => {
			// Arrange
			const { mockDb } = setupDbMocks();

			const { createDatabaseClient } = await import("@saneatsu/db");
			(createDatabaseClient as any).mockReturnValue(mockDb);

			const mockArticle = {
				id: 1,
				cfImageId: null,
			};

			const mockTranslations = [
				{
					content:
						"![画像1](https://imagedelivery.net/test-hash/saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f/medium)",
				},
			];

			// Select記事のモック
			const selectArticleMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockArticle]),
					}),
				}),
			};

			// Select翻訳のモック
			const selectTranslationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			};

			// Delete記事のモック
			const deleteArticleMock = {
				where: vi.fn().mockResolvedValue({}),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock as any)
				.mockReturnValueOnce(selectTranslationsMock as any);
			mockDb.delete.mockReturnValue(deleteArticleMock as any);

			// extractImageIdsFromMarkdownのモック
			mockExtractImageIdsFromMarkdown.mockReturnValue([
				"saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f",
			]);

			// コンテンツ画像削除が失敗する
			mockDeleteImage.mockRejectedValue(
				new Error("Cloudflare Images delete failed")
			);

			// console.errorをモック
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			// Act
			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "記事が正常に削除されました",
			});

			// extractImageIdsFromMarkdownが呼ばれた
			expect(mockExtractImageIdsFromMarkdown).toHaveBeenCalledWith(
				mockTranslations[0].content
			);

			// コンテンツ画像削除が呼ばれた
			expect(mockDeleteImage).toHaveBeenCalledWith(
				"saneatsu-me_content_3edd39f1-128b-40d5-9fe8-98167d94012f",
				{
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
				}
			);

			// エラーがログ出力された
			expect(consoleErrorSpy).toHaveBeenCalled();

			// 記事削除は成功する
			expect(deleteArticleMock.where).toHaveBeenCalled();

			// cleanup
			consoleErrorSpy.mockRestore();
		});

		it("DB削除失敗時、500エラーを返す", async () => {
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

			// Select翻訳のモック（空配列）
			const selectTranslationsMock = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};

			// Delete記事のモック（失敗する）
			const deleteArticleMock = {
				where: vi.fn().mockRejectedValue(new Error("Database delete failed")),
			};

			mockDb.select
				.mockReturnValueOnce(selectArticleMock as any)
				.mockReturnValueOnce(selectTranslationsMock as any);
			mockDb.delete.mockReturnValue(deleteArticleMock as any);

			// Act
			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await articlesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "DELETE_FAILED",
					message: "記事の削除に失敗しました",
				},
			});

			// 記事削除が呼ばれた
			expect(deleteArticleMock.where).toHaveBeenCalled();
		});
	});
});
