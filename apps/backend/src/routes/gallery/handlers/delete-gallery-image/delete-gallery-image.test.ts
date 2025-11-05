import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Env } from "@/env";

import { deleteGalleryImageHandler } from "./delete-gallery-image";
import { deleteGalleryImageRoute } from "./delete-gallery-image.openapi";

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

// モック関数の定義（vi.hoistedを使用してホイスト）
const { mockDeleteImage, mockSelect, mockFrom, mockWhere, mockLimit, mockDelete } = vi.hoisted(() => ({
	mockDeleteImage: vi.fn(),
	mockSelect: vi.fn(),
	mockFrom: vi.fn(),
	mockWhere: vi.fn(),
	mockLimit: vi.fn(),
	mockDelete: vi.fn(),
}));

// モジュールのモック
vi.mock("@/lib", async () => {
	const actual = await vi.importActual("@/lib");
	return {
		...actual,
		deleteImage: mockDeleteImage,
		getDatabase: vi.fn().mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue({
				select: mockSelect,
				delete: mockDelete,
			}),
			galleryImages: {},
		}),
	};
});

describe("Unit Test", () => {
	describe("deleteGalleryImageHandler", () => {
		let app: OpenAPIHono<{ Bindings: Env }>;

		beforeEach(() => {
			vi.clearAllMocks();

			app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				deleteGalleryImageRoute,
				deleteGalleryImageHandler
			);

			// デフォルトのモック実装
			mockSelect.mockReturnValue({
				from: mockFrom,
			});

			mockFrom.mockReturnValue({
				where: mockWhere,
			});

			mockWhere.mockReturnValue({
				limit: mockLimit,
			});

			mockDelete.mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			});

			mockDeleteImage.mockResolvedValue(undefined);
		});

		test("Should delete gallery image successfully", async () => {
			// 存在する画像の削除
			mockLimit.mockResolvedValueOnce([mockExistingImage]);

			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("message");
			expect(mockDeleteImage).toHaveBeenCalledWith("test-image-1", {
				CLOUDFLARE_ACCOUNT_ID: "test-account-id",
				CLOUDFLARE_API_TOKEN: "test-token",
			});
		});

		test("Should delete from DB even when Cloudflare Images deletion fails", async () => {
			// Cloudflare Images削除失敗時でもDB削除は成功
			mockLimit.mockResolvedValueOnce([mockExistingImage]);
			mockDeleteImage.mockRejectedValueOnce(new Error("Cloudflare API error"));

			const req = new Request("http://localhost/1", {
				method: "DELETE",
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("message");
		});

		test("Should return 400 error when id is invalid", async () => {
			// IDが無効
			const req = new Request("http://localhost/invalid", {
				method: "DELETE",
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("error");
			expect(json.error.code).toBe("INVALID_ID");
		});

		test("Should return 404 error when gallery image is not found", async () => {
			// 画像が存在しない
			mockLimit.mockResolvedValueOnce([]);

			const req = new Request("http://localhost/999", {
				method: "DELETE",
			});

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(404);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("NOT_FOUND");
		});
	});
});
