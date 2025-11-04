import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Env } from "@/env";

import { updateGalleryImageHandler } from "./update-gallery-image";

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

// モック関数の定義
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();

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
	};
});

describe("Unit Test", () => {
	describe("updateGalleryImageHandler", () => {
		let app: Hono<{ Bindings: Env }>;

		beforeEach(() => {
			vi.clearAllMocks();

			app = new Hono<{ Bindings: Env }>();
			app.patch("/api/gallery/:id", updateGalleryImageHandler as never);

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
		});

		test("Should update gallery image location successfully", async () => {
			// 位置情報の更新
			mockLimit.mockResolvedValueOnce([mockExistingImage]);
			mockLimit.mockResolvedValueOnce([]);
			mockLimit.mockResolvedValueOnce([mockUpdatedImage]);
			mockWhere.mockResolvedValueOnce(mockTranslations);

			const req = new Request("http://localhost/api/gallery/1", {
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
			// 翻訳データの更新
			mockLimit.mockResolvedValueOnce([mockExistingImage]);
			mockLimit.mockResolvedValueOnce([mockTranslations[0]]);
			mockLimit.mockResolvedValueOnce([mockUpdatedImage]);
			mockWhere.mockResolvedValueOnce(mockTranslations);

			const req = new Request("http://localhost/api/gallery/1", {
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
			// 翻訳データの追加（新しい言語）
			mockLimit.mockResolvedValueOnce([mockExistingImage]);
			mockLimit.mockResolvedValueOnce([]);
			mockLimit.mockResolvedValueOnce([mockUpdatedImage]);
			mockWhere.mockResolvedValueOnce(mockTranslations);

			const req = new Request("http://localhost/api/gallery/1", {
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
			const req = new Request("http://localhost/api/gallery/invalid", {
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
			// 画像が存在しない
			mockLimit.mockResolvedValueOnce([]);

			const req = new Request("http://localhost/api/gallery/999", {
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
	});
});
