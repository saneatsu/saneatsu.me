import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Env } from "@/env";

import { getGalleryImageByIdHandler } from "./get-gallery-image-by-id";

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
const mockGalleryImage = {
	id: 1,
	cfImageId: "test-image-1",
	latitude: 35.6812,
	longitude: 139.7671,
	takenAt: "2024-01-01T00:00:00Z",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-02T00:00:00Z",
};

const mockTranslations = [
	{
		id: 1,
		galleryImageId: 1,
		language: "ja" as const,
		title: "テストタイトル1",
		description: "テスト説明1",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 2,
		galleryImageId: 1,
		language: "en" as const,
		title: "Test Title 1",
		description: "Test Description 1",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// モック関数の定義
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

// モジュールのモック
vi.mock("@/lib", async () => {
	const actual = await vi.importActual("@/lib");
	return {
		...actual,
		getDatabase: vi.fn().mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue({
				select: mockSelect,
			}),
			galleryImages: {},
			galleryImageTranslations: {},
		}),
	};
});

describe("Unit Test", () => {
	describe("getGalleryImageByIdHandler", () => {
		let app: Hono<{ Bindings: Env }>;

		beforeEach(() => {
			vi.clearAllMocks();

			app = new Hono<{ Bindings: Env }>();
			app.get("/api/gallery/:id", getGalleryImageByIdHandler as never);

			// デフォルトのモック実装
			mockSelect.mockReturnValue({
				from: mockFrom,
			});

			mockFrom.mockReturnValue({
				where: mockWhere,
			});
		});

		test("Should get gallery image by id successfully", async () => {
			// 存在する画像IDでの取得
			mockWhere.mockResolvedValueOnce([mockGalleryImage]);
			mockWhere.mockResolvedValueOnce(mockTranslations);

			const req = new Request("http://localhost/api/gallery/1");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("id", 1);
			expect(json).toHaveProperty("cfImageId", "test-image-1");
			expect(json).toHaveProperty("translations");
			expect(json.translations).toHaveLength(2);
		});

		test("Should get gallery image with language parameter", async () => {
			// 言語パラメータ指定
			mockWhere.mockResolvedValueOnce([mockGalleryImage]);
			mockWhere.mockResolvedValueOnce([mockTranslations[0]]);

			const req = new Request("http://localhost/api/gallery/1?language=ja");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.translations).toHaveLength(1);
			expect(json.translations[0].language).toBe("ja");
		});

		test("Should return 400 error when id is invalid", async () => {
			// IDが無効
			const req = new Request("http://localhost/api/gallery/invalid");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("error");
			expect(json.error.code).toBe("INVALID_ID");
		});

		test("Should return 400 error when id is less than 1", async () => {
			// IDが1未満
			const req = new Request("http://localhost/api/gallery/0");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("INVALID_ID");
		});

		test("Should return 404 error when gallery image is not found", async () => {
			// 画像が存在しない
			mockWhere.mockResolvedValueOnce([]);

			const req = new Request("http://localhost/api/gallery/999");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(404);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("NOT_FOUND");
		});
	});
});
