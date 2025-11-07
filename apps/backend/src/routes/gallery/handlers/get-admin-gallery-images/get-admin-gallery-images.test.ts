import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Env } from "@/env";

import { getAdminGalleryImagesHandler } from "./get-admin-gallery-images";
import { getAdminGalleryImagesRoute } from "./get-admin-gallery-images.openapi";

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
		status: "published" as const,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
	{
		id: 2,
		cfImageId: "test-image-2",
		latitude: null,
		longitude: null,
		takenAt: null,
		status: "published" as const,
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
	},
	{
		id: 3,
		cfImageId: "test-image-3",
		latitude: null,
		longitude: null,
		takenAt: null,
		status: "draft" as const,
		createdAt: "2024-01-03T00:00:00Z",
		updatedAt: "2024-01-04T00:00:00Z",
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

// モック関数の定義（vi.hoistedを使用してホイスト）
const { mockSelect, mockGetDatabase } = vi.hoisted(() => ({
	mockSelect: vi.fn(),
	mockGetDatabase: vi.fn(),
}));

// モジュールのモック
vi.mock("@/lib", async () => {
	const actual = await vi.importActual("@/lib");
	return {
		...actual,
		getDatabase: mockGetDatabase,
	};
});

describe("Unit Test", () => {
	describe("getAdminGalleryImagesHandler - ギャラリー画像ステータスフィルタリング", () => {
		let app: OpenAPIHono<{ Bindings: Env }>;

		beforeEach(() => {
			vi.clearAllMocks();
			mockGetDatabase.mockReset();
			mockSelect.mockReset();

			// getDatabase のモック設定
			mockGetDatabase.mockResolvedValue({
				createDatabaseClient: vi.fn().mockReturnValue({
					select: mockSelect,
					selectDistinct: mockSelect,
				}),
				galleryImages: {},
				galleryImageTranslations: {},
				articleGalleryImages: {},
				articles: {},
			});

			app = new OpenAPIHono<{ Bindings: Env }>().openapi(
				getAdminGalleryImagesRoute,
				getAdminGalleryImagesHandler
			);
		});

		test("statusパラメータが指定されていない場合、すべてのステータスの画像を返す", async () => {
			// statusパラメータがない場合、すべてのステータスの画像を返す
			// 期待値: published(2) + draft(1) = 3画像

			// 1. メインクエリ: 画像一覧取得（全ステータス）
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(mockGalleryImages), // 3画像
							}),
						}),
					}),
				}),
			});

			// 2. 翻訳クエリ (画像1つ目)
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});

			// 3. 翻訳クエリ (画像2つ目)
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			// 4. 翻訳クエリ (画像3つ目)
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			// 5. カウントクエリ: 総数取得
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 3 }]),
				}),
			});

			const req = new Request("http://localhost/admin");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.images).toHaveLength(3);
			expect(json.total).toBe(3);
		});

		test("status=published の場合、公開済み画像のみを返す", async () => {
			// status=published の場合、公開済み画像のみを返す
			// 期待値: published(2)

			const publishedImages = mockGalleryImages.filter(
				(img) => img.status === "published"
			);

			// 1. メインクエリ: published画像のみ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(publishedImages),
							}),
						}),
					}),
				}),
			});

			// 2. 翻訳クエリ (画像1つ目)
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});

			// 3. 翻訳クエリ (画像2つ目)
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			// 4. カウントクエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 2 }]),
				}),
			});

			const req = new Request("http://localhost/admin?status=published");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.images).toHaveLength(2);
			expect(json.total).toBe(2);
		});

		test("status=draft の場合、下書き画像のみを返す", async () => {
			// status=draft の場合、下書き画像のみを返す
			// 期待値: draft(1)

			const draftImages = mockGalleryImages.filter(
				(img) => img.status === "draft"
			);

			// 1. メインクエリ: draft画像のみ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(draftImages),
							}),
						}),
					}),
				}),
			});

			// 2. 翻訳クエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			// 3. カウントクエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			});

			const req = new Request("http://localhost/admin?status=draft");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.images).toHaveLength(1);
			expect(json.total).toBe(1);
			expect(json.images[0].status).toBe("draft");
		});

		test("status=published,draft の場合、公開済みと下書きの両方の画像を返す", async () => {
			// status=published,draft の場合、両方のステータスの画像を返す
			// 期待値: published(2) + draft(1) = 3

			// 1. メインクエリ: 全画像
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(mockGalleryImages),
							}),
						}),
					}),
				}),
			});

			// 2-4. 翻訳クエリ (3画像分)
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTranslations),
				}),
			});
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			});

			// 5. カウントクエリ
			mockSelect.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 3 }]),
				}),
			});

			const req = new Request("http://localhost/admin?status=published,draft");
			const res = await app.fetch(req, mockEnv);

			expect(res.status).toBe(200);

			const json = (await res.json()) as any;
			expect(json.images).toHaveLength(3);
			expect(json.total).toBe(3);
		});
	});
});
