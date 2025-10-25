import { beforeEach, describe, expect, it, vi } from "vitest";

import { imagesRoute } from "@/routes/images";
import type { Env } from "@/types/env";

// Cloudflare Imagesモジュールのモック
const { mockDeleteImage } = vi.hoisted(() => ({
	mockDeleteImage: vi.fn(),
}));

vi.mock("@/lib/cloudflare-images/cloudflare-images", () => ({
	deleteImage: mockDeleteImage,
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
	describe("DELETE /images/:imageId - 汎用画像削除", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("画像を正常に削除できる", async () => {
			// Arrange
			mockDeleteImage.mockResolvedValue({ success: true });

			// Act
			const req = new Request("http://localhost/test-image-id-123", {
				method: "DELETE",
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "画像が正常に削除されました",
			});

			// Delete should be called with correct parameters
			expect(mockDeleteImage).toHaveBeenCalledWith("test-image-id-123", {
				CLOUDFLARE_ACCOUNT_ID: "test-account-id",
				CLOUDFLARE_API_TOKEN: "test-token",
			});
		});

		it("Cloudflare Images APIが失敗した場合、500エラーを返す", async () => {
			// Arrange
			mockDeleteImage.mockRejectedValue(
				new Error("Cloudflare Images delete failed: 500 Internal Server Error")
			);

			// Act
			const req = new Request("http://localhost/test-image-id-456", {
				method: "DELETE",
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "DELETE_FAILED",
					message: "画像の削除に失敗しました",
				},
			});

			// Delete should have been called
			expect(mockDeleteImage).toHaveBeenCalledWith("test-image-id-456", {
				CLOUDFLARE_ACCOUNT_ID: "test-account-id",
				CLOUDFLARE_API_TOKEN: "test-token",
			});
		});

		it("存在しない画像の削除時、500エラーを返す", async () => {
			// Arrange
			// Cloudflare Images APIは存在しない画像の削除でもエラーを返す
			mockDeleteImage.mockRejectedValue(
				new Error("Cloudflare Images delete failed: 404 Not Found")
			);

			// Act
			const req = new Request("http://localhost/non-existent-image-id", {
				method: "DELETE",
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "DELETE_FAILED",
					message: "画像の削除に失敗しました",
				},
			});
		});
	});
});
