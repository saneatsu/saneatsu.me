import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "@/env";
import { imagesRoute } from "@/routes/images";

// Cloudflare Imagesモジュールのモック
const { mockUploadImage, mockGetImageUrl } = vi.hoisted(() => ({
	mockUploadImage: vi.fn(),
	mockGetImageUrl: vi.fn(),
}));

vi.mock("@/lib/cloudflare-images/cloudflare-images", () => ({
	uploadImage: mockUploadImage,
	getImageUrl: mockGetImageUrl,
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
	describe("POST /images - 汎用画像アップロード", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("画像を正常にアップロードできる", async () => {
			// Arrange（CustomImageId形式）
			const mockCustomId =
				"saneatsu-me_development_content_2cdc28f0-017a-49c4-9ed7-87056c83901f";
			mockUploadImage.mockResolvedValue({
				imageId: mockCustomId,
			});
			mockGetImageUrl.mockReturnValue(
				`https://imagedelivery.net/test-hash/${mockCustomId}/original`
			);

			// Act
			const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				imageId: mockCustomId,
				imageUrl: `https://imagedelivery.net/test-hash/${mockCustomId}/original`,
				message: "画像が正常にアップロードされました",
			});

			// Upload should be called（contentプレフィックス付き、環境変数含む）
			expect(mockUploadImage).toHaveBeenCalledWith(
				expect.any(File),
				expect.objectContaining({
					CLOUDFLARE_ACCOUNT_ID: "test-account-id",
					CLOUDFLARE_API_TOKEN: "test-token",
					NODE_ENV: "development",
				}),
				{ prefix: "content" }
			);

			// Image URL should be generated with original variant
			expect(mockGetImageUrl).toHaveBeenCalledWith(
				mockCustomId,
				"original",
				"test-hash"
			);
		});

		it("ファイルが指定されていない場合、400エラーを返す", async () => {
			// Act
			const formData = new FormData();
			// Don't add file

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

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

			// Upload should not be called
			expect(mockUploadImage).not.toHaveBeenCalled();
		});

		it("ファイルサイズが10MBを超える場合、400エラーを返す", async () => {
			// Act
			// Create a mock file that is larger than 10MB
			const largeFileSize = 11 * 1024 * 1024; // 11MB
			const largeBuffer = new Uint8Array(largeFileSize);
			const mockFile = new File([largeBuffer], "large.jpg", {
				type: "image/jpeg",
			});
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "FILE_TOO_LARGE",
					message:
						"ファイルサイズが大きすぎます。最大10MBまでアップロードできます。",
				},
			});

			// Upload should not be called
			expect(mockUploadImage).not.toHaveBeenCalled();
		});

		it("許可されていないファイル形式の場合、400エラーを返す（PDF）", async () => {
			// Act
			const mockFile = new File(["test"], "test.pdf", {
				type: "application/pdf",
			});
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "INVALID_FILE_TYPE",
					message:
						"許可されていないファイル形式です。JPEG、PNG、GIF、WebP形式のみアップロードできます。（受信: application/pdf）",
				},
			});

			// Upload should not be called
			expect(mockUploadImage).not.toHaveBeenCalled();
		});

		it("許可されていないファイル形式の場合、400エラーを返す（SVG）", async () => {
			// Act
			const mockFile = new File(["test"], "test.svg", {
				type: "image/svg+xml",
			});
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "INVALID_FILE_TYPE",
					message:
						"許可されていないファイル形式です。JPEG、PNG、GIF、WebP形式のみアップロードできます。（受信: image/svg+xml）",
				},
			});

			// Upload should not be called
			expect(mockUploadImage).not.toHaveBeenCalled();
		});

		it("PNG形式を受け入れる", async () => {
			// Arrange（CustomImageId形式）
			const mockPngCustomId =
				"saneatsu-me_development_content_3edd39f1-128b-40d5-9fe8-98167d94012f";
			mockUploadImage.mockResolvedValue({
				imageId: mockPngCustomId,
			});
			mockGetImageUrl.mockReturnValue(
				`https://imagedelivery.net/test-hash/${mockPngCustomId}/original`
			);

			// Act
			const mockFile = new File(["test"], "test.png", { type: "image/png" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			expect(mockUploadImage).toHaveBeenCalled();
		});

		it("GIF形式を受け入れる", async () => {
			// Arrange（CustomImageId形式）
			const mockGifCustomId =
				"saneatsu-me_development_content_4fee40a2-239c-41e6-8af9-09278e05013a";
			mockUploadImage.mockResolvedValue({
				imageId: mockGifCustomId,
			});
			mockGetImageUrl.mockReturnValue(
				`https://imagedelivery.net/test-hash/${mockGifCustomId}/original`
			);

			// Act
			const mockFile = new File(["test"], "test.gif", { type: "image/gif" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			expect(mockUploadImage).toHaveBeenCalled();
		});

		it("WebP形式を受け入れる", async () => {
			// Arrange（CustomImageId形式）
			const mockWebpCustomId =
				"saneatsu-me_content_5aff51b3-340d-42f7-9ba0-10389f16024b";
			mockUploadImage.mockResolvedValue({
				imageId: mockWebpCustomId,
			});
			mockGetImageUrl.mockReturnValue(
				`https://imagedelivery.net/test-hash/${mockWebpCustomId}/original`
			);

			// Act
			const mockFile = new File(["test"], "test.webp", { type: "image/webp" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(200);
			expect(mockUploadImage).toHaveBeenCalled();
		});

		it("Cloudflare Images APIが失敗した場合、500エラーを返す", async () => {
			// Arrange
			mockUploadImage.mockRejectedValue(
				new Error("Cloudflare Images upload failed: 500 Internal Server Error")
			);

			// Act
			const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const formData = new FormData();
			formData.append("file", mockFile);

			const req = new Request("http://localhost/", {
				method: "POST",
				body: formData,
			});

			const res = await imagesRoute.fetch(req, mockEnv);

			// Assert
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				error: {
					code: "UPLOAD_FAILED",
					message: "画像のアップロードに失敗しました",
				},
			});
		});
	});
});
