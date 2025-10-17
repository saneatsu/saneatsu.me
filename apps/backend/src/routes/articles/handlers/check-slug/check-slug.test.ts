import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { articlesRoute } from "@/routes/articles";
import { setupDbMocks } from "@/utils/drizzle-test";

// モック設定
vi.mock("@saneatsu/db/worker", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	tags: {},
	users: {},
	createDatabaseClient: vi.fn(),
}));

describe("GET /articles/check-slug - スラッグ重複チェック", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("利用可能なスラッグの場合、availableがtrueを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const selectMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 記事が見つからない（スラッグが利用可能）
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(selectMock);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await (client as any)["check-slug"].$get({
			query: {
				slug: "available-slug",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toEqual({
			available: true,
		});
	});

	it("既に使用されているスラッグの場合、availableがfalseを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		const selectMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{ id: 1, slug: "used-slug" }, // 既に記事が存在
					]),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(selectMock);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await (client as any)["check-slug"].$get({
			query: {
				slug: "used-slug",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toEqual({
			available: false,
			message: "このスラッグは既に使用されています",
		});
	});

	it("スラッグパラメータが空の場合、400エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// Act
		const client = testClient(articlesRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await (client as any)["check-slug"].$get({
			query: {
				slug: "",
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.select).not.toHaveBeenCalled();
	});
});
