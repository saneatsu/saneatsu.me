import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Env } from "@/env";

import { updateGalleryImageHandler } from "./update-gallery-image";
import { updateGalleryImageRoute } from "./update-gallery-image.openapi";

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

// モック用のテストデータ
const mockExistingImage = {
	id: 1,
	cfImageId: "test-image-1",
	latitude: 35.6812,
	longitude: 139.7671,
	takenAt: "2024-01-01T00:00:00Z",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-02T00:00:00Z",
};

const mockUpdatedImage = {
	...mockExistingImage,
	latitude: 35.0,
	longitude: 140.0,
	updatedAt: "2024-01-03T00:00:00Z",
};

const mockTranslations = [
	{
		id: 1,
		galleryImageId: 1,
		language: "ja" as const,
		title: "更新されたタイトル",
		description: "更新された説明",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
	},
];

// モック関数の定義（vi.hoistedを使用してホイスト）
const {
	mockSelect,
	mockFrom,
	mockWhere,
	mockLimit,
	mockUpdate,
	mockSet,
	mockInsert,
	mockValues,
	mockUploadImage,
	mockDeleteImage,
} = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockFrom: vi.fn(),
	mockWhere: vi.fn(),
	mockLimit: vi.fn(),
	mockUpdate: vi.fn(),
	mockSet: vi.fn(),
	mockInsert: vi.fn(),
	mockValues: vi.fn(),
	mockUploadImage: vi.fn(),
	mockDeleteImage: vi.fn(),
}));

// モジュールのモック
vi.mock("@/lib", async () => {
	const actual = await vi.importActual("@/lib");
	return {
		...actual,
		getDatabase: vi.fn().mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue({
				select: mockSelect,
				update: mockUpdate,
				insert: mockInsert,
			}),
			galleryImages: {},
			galleryImageTranslations: {},
		}),
		uploadImage: mockUploadImage,
		deleteImage: mockDeleteImage,
	};
});

describe("Unit Test", () => {
	describe("updateGalleryImageHandler", () => {
		let app: OpenAPIHono<{ Bindings: Env }>;

		beforeEach(() => {
			vi.clearAllMocks();

			app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				updateGalleryImageRoute,
				updateGalleryImageHandler
			);
		});

		// デフォルトのモック実装（チェーンのみ、データは各テストで設定）
		mockSelect.mockReturnValue({
			from: mockFrom,
		});

		mockFrom.mockReturnValue({
			where: mockWhere,
		});

		mockWhere.mockReturnValue({
			limit: mockLimit,
		});

		mockUpdate.mockReturnValue({
			set: mockSet,
		});

		mockSet.mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		});

		mockInsert.mockReturnValue({
			values: mockValues,
		});

		mockValues.mockResolvedValue(undefined);

		test("Should update gallery image location successfully", async () => {
			// 1. 画像存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockExistingImage]),
					}),
				}),
			});

			// 2. 更新後の画像取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockUpdatedImage]),
					}),
				}),
			});

			// 3. 翻訳取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});

			const req = new Request("http://localhost/1", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					latitude: 35.0,
					longitude: 140.0,
				}),
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("data");
			expect(json).toHaveProperty("message");
			expect(json.data.latitude).toBe(35.0);
			expect(json.data.longitude).toBe(140.0);
		});

		test("Should update gallery image translations successfully", async () => {
			// 1. 画像存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockExistingImage]),
					}),
				}),
			});

			// 2. 翻訳存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockTranslations[0]]),
					}),
				}),
			});

			// 3. 更新後の画像取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockUpdatedImage]),
					}),
				}),
			});

			// 4. 翻訳取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});

			const req = new Request("http://localhost/1", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					translations: [
						{
							language: "ja",
							title: "更新されたタイトル",
							description: "更新された説明",
						},
					],
				}),
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.data.translations).toHaveLength(1);
			expect(json.data.translations[0].title).toBe("更新されたタイトル");
		});

		test("Should add new translation successfully", async () => {
			// 1. 画像存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockExistingImage]),
					}),
				}),
			});

			// 2. 翻訳存在確認クエリ（存在しない）
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			// 3. 更新後の画像取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockUpdatedImage]),
					}),
				}),
			});

			// 4. 翻訳取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});

			const req = new Request("http://localhost/1", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					translations: [
						{
							language: "en",
							title: "New English Title",
							description: "New English Description",
						},
					],
				}),
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
		});

		test("Should return 400 error when id is invalid", async () => {
			// IDが無効
			const req = new Request("http://localhost/invalid", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					latitude: 35.0,
				}),
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("error");
			expect(json.error.code).toBe("INVALID_ID");
		});

		test("Should return 404 error when gallery image is not found", async () => {
			// 1. 画像存在確認クエリ（存在しない）
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			const req = new Request("http://localhost/999", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					latitude: 35.0,
				}),
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(404);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("NOT_FOUND");
		});

		test("Should replace gallery image with FormData successfully", async () => {
			// 1. 画像存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockExistingImage]),
					}),
				}),
			});

			// 2. uploadImageのモック
			mockUploadImage.mockResolvedValue({
				imageId: "new-test-image-id",
			});

			// 3. deleteImageのモック
			mockDeleteImage.mockResolvedValue({
				success: true,
			});

			// 4. 更新後の画像取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								...mockUpdatedImage,
								cfImageId: "new-test-image-id",
							},
						]),
					}),
				}),
			});

			// 5. 翻訳取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});

			// FormDataの作成
			const formData = new FormData();
			const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
			formData.append("file", file);
			formData.append("latitude", "35.5");
			formData.append("longitude", "140.5");

			const req = new Request("http://localhost/1", {
				method: "PATCH",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.data.cfImageId).toBe("new-test-image-id");
			expect(mockUploadImage).toHaveBeenCalledTimes(1);
			expect(mockDeleteImage).toHaveBeenCalledTimes(1);
		});

		test("Should return 400 error when file size is too large", async () => {
			// 1. 画像存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockExistingImage]),
					}),
				}),
			});

			// 11MBのファイルを作成（制限は10MB）
			const formData = new FormData();
			const largeFile = new File(
				[new Uint8Array(11 * 1024 * 1024)],
				"large.jpg",
				{
					type: "image/jpeg",
				}
			);
			formData.append("file", largeFile);

			const req = new Request("http://localhost/1", {
				method: "PATCH",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("FILE_TOO_LARGE");
		});

		test("Should return 400 error when file type is invalid", async () => {
			// 1. 画像存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockExistingImage]),
					}),
				}),
			});

			// 不正なファイル形式
			const formData = new FormData();
			const invalidFile = new File(["test"], "test.pdf", {
				type: "application/pdf",
			});
			formData.append("file", invalidFile);

			const req = new Request("http://localhost/1", {
				method: "PATCH",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("INVALID_FILE_TYPE");
		});

		test("Should update image with FormData and translations", async () => {
			// 1. 画像存在確認クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockExistingImage]),
					}),
				}),
			});

			// 2. uploadImageのモック
			mockUploadImage.mockResolvedValue({
				imageId: "new-test-image-id-2",
			});

			// 3. deleteImageのモック
			mockDeleteImage.mockResolvedValue({
				success: true,
			});

			// 4. 翻訳存在確認クエリ（存在する）
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockTranslations[0]]),
					}),
				}),
			});

			// 5. 更新後の画像取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([
							{
								...mockUpdatedImage,
								cfImageId: "new-test-image-id-2",
							},
						]),
					}),
				}),
			});

			// 6. 翻訳取得クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});

			// FormDataの作成
			const formData = new FormData();
			const file = new File(["test"], "test.png", { type: "image/png" });
			formData.append("file", file);
			formData.append(
				"translations",
				JSON.stringify([
					{
						language: "ja",
						title: "FormDataタイトル",
						description: "FormData説明",
					},
				])
			);

			const req = new Request("http://localhost/1", {
				method: "PATCH",
				body: formData,
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.data.cfImageId).toBe("new-test-image-id-2");
			expect(mockUploadImage).toHaveBeenCalledTimes(1);
			expect(mockDeleteImage).toHaveBeenCalledTimes(1);
		});
	});
});
