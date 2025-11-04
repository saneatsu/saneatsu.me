import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Env } from "@/env";

import { getGalleryImagesHandler } from "./get-gallery-images";

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
const mockGalleryImages = [
	{
		id: 1,
		cfImageId: "test-image-1",
		latitude: 35.6812,
		longitude: 139.7671,
		takenAt: "2024-01-01T00:00:00Z",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
	{
		id: 2,
		cfImageId: "test-image-2",
		latitude: null,
		longitude: null,
		takenAt: null,
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
	},
];

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
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();

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
	describe("getGalleryImagesHandler", () => {
		let app: Hono<{ Bindings: Env }>;

		beforeEach(() => {
			vi.clearAllMocks();

			app = new Hono<{ Bindings: Env }>();
			app.get("/api/gallery", getGalleryImagesHandler as never);

			// デフォルトのモック実装
			mockSelect.mockReturnValue({
				from: mockFrom,
			});

			mockFrom.mockReturnValue({
				where: mockWhere,
			});

			mockWhere.mockReturnValue({
				orderBy: mockOrderBy,
			});

			mockOrderBy.mockReturnValue({
				limit: mockLimit,
			});

			mockLimit.mockReturnValue({
				offset: mockOffset,
			});

			// 画像一覧の取得
			mockOffset.mockResolvedValueOnce(mockGalleryImages);

			// 各画像の翻訳データ取得
			mockFrom.mockReturnValueOnce({
				where: vi.fn().mockResolvedValue(mockTranslations),
			});

			mockFrom.mockReturnValueOnce({
				where: vi.fn().mockResolvedValue([]),
			});

			// 総数取得
			mockFrom.mockReturnValueOnce({
				where: vi.fn().mockResolvedValue([{ count: 2 }]),
			});
		});

		test("Should get gallery images with default parameters", async () => {
			// デフォルトパラメータでの取得
			const req = new Request("http://localhost/api/gallery");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("images");
			expect(json).toHaveProperty("total");
			expect(json).toHaveProperty("page");
			expect(json).toHaveProperty("limit");
		});

		test("Should get gallery images with pagination", async () => {
			// ページネーション
			const req = new Request("http://localhost/api/gallery?page=2&limit=10");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.page).toBe(2);
			expect(json.limit).toBe(10);
		});

		test("Should filter gallery images by location", async () => {
			// 位置情報フィルター（あり）
			const req = new Request("http://localhost/api/gallery?hasLocation=true");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
		});

		test("Should filter gallery images without location", async () => {
			// 位置情報フィルター（なし）
			const req = new Request("http://localhost/api/gallery?hasLocation=false");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
		});

		test("Should sort gallery images by updatedAt desc", async () => {
			// ソート（updatedAt desc）
			const req = new Request(
				"http://localhost/api/gallery?sortBy=updatedAt&sortOrder=desc"
			);

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
		});

		test("Should sort gallery images by takenAt asc", async () => {
			// ソート（takenAt asc）
			const req = new Request(
				"http://localhost/api/gallery?sortBy=takenAt&sortOrder=asc"
			);

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);
		});

		test("Should return 400 error when page is less than 1", async () => {
			// ページ番号が1未満
			const req = new Request("http://localhost/api/gallery?page=0");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json).toHaveProperty("error");
			expect(json.error.code).toBe("INVALID_PAGE");
		});

		test("Should return 400 error when limit is out of range", async () => {
			// リミットが範囲外（1〜100）
			const req = new Request("http://localhost/api/gallery?limit=101");

			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(400);

			const json = (await res.json()) as any;
			expect(json.error.code).toBe("INVALID_LIMIT");
		});
	});
});
