import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteImage, getImageUrl, uploadImage } from "./index";

describe("Cloudflare Images APIクライアント", () => {
	const mockEnv = {
		CLOUDFLARE_ACCOUNT_ID: "test-account-id",
		CLOUDFLARE_IMAGES_TOKEN: "test-token",
		CLOUDFLARE_ACCOUNT_HASH: "test-hash",
	};

	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// fetchのモックをリセット
		mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);
	});

	describe("ユニットテスト", () => {
		describe("uploadImage", () => {
			it("画像を正常にアップロードできる", async () => {
				const mockFile = new File(["test"], "test.jpg", {
					type: "image/jpeg",
				});

				mockFetch.mockResolvedValue({
					ok: true,
					json: async () => ({
						success: true,
						result: {
							id: "test-image-id-123",
							filename: "test.jpg",
							uploaded: "2024-01-01T00:00:00.000Z",
							requireSignedURLs: false,
							variants: [
								"https://imagedelivery.net/test-hash/test-image-id-123/small",
							],
						},
						errors: [],
						messages: [],
					}),
				});

				const result = await uploadImage(mockFile, mockEnv);

				expect(result).toEqual({
					imageId: "test-image-id-123",
				});

				expect(mockFetch).toHaveBeenCalledWith(
					"https://api.cloudflare.com/client/v4/accounts/test-account-id/images/v1",
					expect.objectContaining({
						method: "POST",
						headers: {
							Authorization: "Bearer test-token",
						},
					})
				);
			});

			it("HTTPリクエストが失敗した場合、エラーをスローする", async () => {
				const mockFile = new File(["test"], "test.jpg", {
					type: "image/jpeg",
				});

				mockFetch.mockResolvedValue({
					ok: false,
					status: 500,
					text: async () => "Internal Server Error",
				});

				await expect(uploadImage(mockFile, mockEnv)).rejects.toThrow(
					"Cloudflare Images upload failed: 500 Internal Server Error"
				);
			});

			it("APIがsuccess=falseを返した場合、エラーをスローする", async () => {
				const mockFile = new File(["test"], "test.jpg", {
					type: "image/jpeg",
				});

				mockFetch.mockResolvedValue({
					ok: true,
					json: async () => ({
						success: false,
						result: {},
						errors: [{ code: 1000, message: "Invalid file format" }],
						messages: [],
					}),
				});

				await expect(uploadImage(mockFile, mockEnv)).rejects.toThrow(
					"Cloudflare Images upload failed: Invalid file format"
				);
			});
		});

		describe("deleteImage", () => {
			it("画像を正常に削除できる", async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					json: async () => ({
						success: true,
						result: {},
						errors: [],
						messages: [],
					}),
				});

				const result = await deleteImage("test-image-id-123", mockEnv);

				expect(result).toEqual({
					success: true,
				});

				expect(mockFetch).toHaveBeenCalledWith(
					"https://api.cloudflare.com/client/v4/accounts/test-account-id/images/v1/test-image-id-123",
					{
						method: "DELETE",
						headers: {
							Authorization: "Bearer test-token",
						},
					}
				);
			});

			it("HTTPリクエストが失敗した場合、エラーをスローする", async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 404,
					text: async () => "Not Found",
				});

				await expect(deleteImage("test-image-id-123", mockEnv)).rejects.toThrow(
					"Cloudflare Images delete failed: 404 Not Found"
				);
			});

			it("APIがsuccess=falseを返した場合、エラーをスローする", async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					json: async () => ({
						success: false,
						result: {},
						errors: [{ code: 2000, message: "Image not found" }],
						messages: [],
					}),
				});

				await expect(deleteImage("test-image-id-123", mockEnv)).rejects.toThrow(
					"Cloudflare Images delete failed: Image not found"
				);
			});
		});

		describe("getImageUrl", () => {
			it("smallバリアントの正しいURLを生成する", () => {
				const url = getImageUrl(
					"test-image-id-123",
					"small",
					mockEnv.CLOUDFLARE_ACCOUNT_HASH
				);

				expect(url).toBe(
					"https://imagedelivery.net/test-hash/test-image-id-123/small"
				);
			});

			it("mediumバリアントの正しいURLを生成する", () => {
				const url = getImageUrl(
					"test-image-id-123",
					"medium",
					mockEnv.CLOUDFLARE_ACCOUNT_HASH
				);

				expect(url).toBe(
					"https://imagedelivery.net/test-hash/test-image-id-123/medium"
				);
			});

			it("largeバリアントの正しいURLを生成する", () => {
				const url = getImageUrl(
					"test-image-id-123",
					"large",
					mockEnv.CLOUDFLARE_ACCOUNT_HASH
				);

				expect(url).toBe(
					"https://imagedelivery.net/test-hash/test-image-id-123/large"
				);
			});

			it("xlargeバリアントの正しいURLを生成する", () => {
				const url = getImageUrl(
					"test-image-id-123",
					"xlarge",
					mockEnv.CLOUDFLARE_ACCOUNT_HASH
				);

				expect(url).toBe(
					"https://imagedelivery.net/test-hash/test-image-id-123/xlarge"
				);
			});
		});
	});
});
