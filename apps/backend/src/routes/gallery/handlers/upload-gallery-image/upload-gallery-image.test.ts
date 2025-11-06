import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Env } from "@/env";

import { uploadGalleryImageHandler } from "./upload-gallery-image";

// テスト用のモックEnv
const mockEnv: Env = {
	NODE_ENV: "test" as "development",
	TURSO_DATABASE_URL: "test-db-url",
	TURSO_AUTH_TOKEN: "test-auth-token",
	CLOUDFLARE_ACCOUNT_ID: "test-account-id",
	CLOUDFLARE_API_TOKEN: "test-token",
	CLOUDFLARE_ACCOUNT_HASH: "test-hash",
	GEMINI_API_KEY: "test-gemini-key",
	MAPBOX_ACCESS_TOKEN: "test-mapbox-token",
};

// モック関数の定義
const { mockUploadImage, mockTranslateGalleryImage, mockGetImageUrl } =
	vi.hoisted(() => ({
		mockUploadImage: vi.fn(),
		mockTranslateGalleryImage: vi.fn(),
		mockGetImageUrl: vi.fn(),
	}));

// モジュールのモック
vi.mock("@/lib", async () => {
	const actual = await vi.importActual("@/lib");
	return {
		...actual,
		uploadImage: mockUploadImage,
		translateGalleryImage: mockTranslateGalleryImage,
		getImageUrl: mockGetImageUrl,
		getDatabase: vi.fn().mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue({
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([
							{
								id: 1,
								cfImageId: "test-image-id",
								latitude: 35.6812,
								longitude: 139.7671,
								takenAt: "2024-01-01T00:00:00Z",
								createdAt: "2024-01-01T00:00:00Z",
								updatedAt: "2024-01-01T00:00:00Z",
							},
						]),
					}),
				}),
			}),
			galleryImages: {},
			galleryImageTranslations: {},
		}),
	};
});

describe("Unit Test", () => {
	describe("uploadGalleryImageHandler", () => {
		let app: Hono<{ Bindings: Env }>;

		beforeEach(() => {
			vi.clearAllMocks();

			app = new Hono<{ Bindings: Env }>();
			app.post("/api/gallery", uploadGalleryImageHandler as never);

			// デフォルトのモック実装
			mockTranslateGalleryImage.mockResolvedValue({
				ja: {
					title: "テストタイトル",
					description: "テスト説明",
				},
				en: {
					title: "Test Title",
					description: "Test Description",
				},
			});

			mockUploadImage.mockResolvedValue({
				imageId: "test-image-id",
			});

			mockGetImageUrl.mockReturnValue(
				"https://imagedelivery.net/test-hash/test-image-id/original"
			);
		});

		test("Should upload image successfully with valid file, title, and description", async () => {
			// 正常なファイルアップロード
			const file = new File(["test content"], "test.jpg", {
				type: "image/jpeg",
			});

			const formData = new FormData();
			formData.append("file", file);
			formData.append("titleJa", "テストタイトル");
			formData.append("descriptionJa", "テスト説明");

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("id", 1);
			expect(json).toHaveProperty("imageId", "test-image-id");
			expect(json).toHaveProperty("imageUrl");
			expect(json).toHaveProperty("message");
		});

		test("Should upload image with location data", async () => {
			// 位置情報付きアップロード
			const file = new File(["test content"], "test.jpg", {
				type: "image/jpeg",
			});

			const formData = new FormData();
			formData.append("file", file);
			formData.append("titleJa", "テストタイトル");
			formData.append("latitude", "35.6812");
			formData.append("longitude", "139.7671");
			formData.append("takenAt", "2024-01-01T00:00:00Z");

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
		});

		test("Should return 400 error when file is missing", async () => {
			// ファイルが存在しない場合
			const formData = new FormData();
			formData.append("titleJa", "テストタイトル");

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("error");
			expect(json.error.code).toBe("INVALID_REQUEST");
		});

		test("Should return 400 error when file size exceeds 10MB", async () => {
			// ファイルサイズが10MB超過
			const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
			const file = new File([largeContent], "large.jpg", {
				type: "image/jpeg",
			});

			const formData = new FormData();
			formData.append("file", file);
			formData.append("titleJa", "テストタイトル");

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("FILE_TOO_LARGE");
		});

		test("Should return 400 error when file type is not allowed", async () => {
			// 許可されていないファイル形式
			const file = new File(["test content"], "test.txt", {
				type: "text/plain",
			});

			const formData = new FormData();
			formData.append("file", file);
			formData.append("titleJa", "テストタイトル");

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("INVALID_FILE_TYPE");
		});

		test("Should return 400 error when both title and description are missing", async () => {
			// タイトルと説明が両方とも未指定
			const file = new File(["test content"], "test.jpg", {
				type: "image/jpeg",
			});

			const formData = new FormData();
			formData.append("file", file);

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("INVALID_REQUEST");
		});

		test("Should return 400 error when latitude is out of range", async () => {
			// 緯度が範囲外（-90〜90）
			const file = new File(["test content"], "test.jpg", {
				type: "image/jpeg",
			});

			const formData = new FormData();
			formData.append("file", file);
			formData.append("titleJa", "テストタイトル");
			formData.append("latitude", "100");

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("INVALID_LATITUDE");
		});

		test("Should return 400 error when longitude is out of range", async () => {
			// 経度が範囲外（-180〜180）
			const file = new File(["test content"], "test.jpg", {
				type: "image/jpeg",
			});

			const formData = new FormData();
			formData.append("file", file);
			formData.append("titleJa", "テストタイトル");
			formData.append("longitude", "200");

			const req = new Request("http://localhost/api/gallery", {
				method: "POST",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("INVALID_LONGITUDE");
		});
	});
});
