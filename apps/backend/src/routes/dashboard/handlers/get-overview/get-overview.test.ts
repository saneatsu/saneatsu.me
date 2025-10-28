import { OpenAPIHono } from "@hono/zod-openapi";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setupDbMocks } from "@/utils/drizzle-test";

import { getDashboardOverview } from "./get-overview";
import { getDashboardOverviewRoute } from "./get-overview.openapi";

// モック設定
vi.mock("@saneatsu/db/worker", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	tags: {},
	tagTranslations: {},
	users: {},
	dailyArticleViews: {},
	createDatabaseClient: vi.fn(),
}));

vi.mock("@saneatsu/db", () => ({
	articles: {},
	articleTranslations: {},
	articleTags: {},
	tags: {},
	tagTranslations: {},
	users: {},
	dailyArticleViews: {},
	createDatabaseClient: vi.fn(),
}));

describe("GET /dashboard/overview - ダッシュボード概要取得", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("複数翻訳がある場合でも記事数が正しくカウントされる", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 総記事数のモック（正しい実装：count()を使用）
		const totalArticlesCountMock = {
			from: vi.fn().mockResolvedValue([{ count: 100 }]),
		};

		// 公開済み記事数のモック
		const publishedArticlesCountMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 80 }]),
			}),
		};

		// 下書き記事数のモック
		const draftArticlesCountMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 15 }]),
			}),
		};

		// アーカイブ記事数のモック
		const archivedArticlesCountMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 5 }]),
			}),
		};

		// 総閲覧数のモック（articlesテーブルから取得、言語フィルターなし）
		const totalViewsMock = {
			from: vi.fn().mockResolvedValue([{ totalViews: 5000 }]),
		};

		// 今月の閲覧数のモック
		const thisMonthViewsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ thisMonthViews: 500 }]),
			}),
		};

		// 人気記事トップ5のモック
		const topArticlesMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									slug: "article-1",
									title: "記事1",
									viewCount: 500,
									publishedAt: "2024-01-01T00:00:00.000Z",
									cfImageId: "image-1",
									updatedAt: "2024-01-01T00:00:00.000Z",
								},
								{
									id: 2,
									slug: "article-2",
									title: "記事2",
									viewCount: 400,
									publishedAt: "2024-01-02T00:00:00.000Z",
									cfImageId: null,
									updatedAt: "2024-01-02T00:00:00.000Z",
								},
							]),
						}),
					}),
				}),
			}),
		};

		// タグ情報のモック
		const articleTagsDataMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([
							{
								articleId: 1,
								tagId: 1,
								tagName: "タグ1",
								tagLanguage: "ja",
							},
							{
								articleId: 1,
								tagId: 1,
								tagName: "Tag1",
								tagLanguage: "en",
							},
							{
								articleId: 2,
								tagId: 2,
								tagName: "タグ2",
								tagLanguage: "ja",
							},
							{
								articleId: 2,
								tagId: 2,
								tagName: "Tag2",
								tagLanguage: "en",
							},
						]),
					}),
				}),
			}),
		};

		// 最近の活動のモック
		const recentActivitiesMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: 1,
									type: "article_created",
									description: "記事が作成されました",
									entityId: 1,
									entityTitle: "記事1",
									createdAt: "2024-01-01T00:00:00.000Z",
								},
							]),
						}),
					}),
				}),
			}),
		};

		// selectのモックチェーンを設定
		mockDb.select
			.mockReturnValueOnce(totalArticlesCountMock) // 総記事数
			.mockReturnValueOnce(publishedArticlesCountMock) // 公開済み記事数
			.mockReturnValueOnce(draftArticlesCountMock) // 下書き記事数
			.mockReturnValueOnce(archivedArticlesCountMock) // アーカイブ記事数
			.mockReturnValueOnce(totalViewsMock) // 総閲覧数
			.mockReturnValueOnce(thisMonthViewsMock) // 今月の閲覧数
			.mockReturnValueOnce(topArticlesMock) // 人気記事トップ5
			.mockReturnValueOnce(articleTagsDataMock) // タグ情報
			.mockReturnValueOnce(recentActivitiesMock); // 最近の活動

		// Act
		const app = new OpenAPIHono<{
			Bindings: { TURSO_DATABASE_URL: string; TURSO_AUTH_TOKEN: string };
		}>();
		// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
		app.openapi(getDashboardOverviewRoute, getDashboardOverview);

		const client = testClient(app, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.overview.$get({
			query: {
				language: "ja",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		// 記事統計が正しいこと
		expect(data.articleStats.totalArticles).toBe(100);
		expect(data.articleStats.publishedArticles).toBe(80);
		expect(data.articleStats.draftArticles).toBe(15);
		expect(data.articleStats.archivedArticles).toBe(5);
		expect(data.articleStats.totalViews).toBe(5000);

		// 人気記事が取得できていること
		expect(data.topArticles.articles).toHaveLength(2);
		expect(data.topArticles.articles[0].title).toBe("記事1");
		expect(data.topArticles.articles[0].cfImageId).toBe("image-1");
		expect(data.topArticles.articles[0].tags).toHaveLength(1);
		expect(data.topArticles.articles[0].tags[0].id).toBe(1);
		expect(data.topArticles.articles[0].tags[0].translations.ja).toBe("タグ1");
		expect(data.topArticles.articles[0].tags[0].translations.en).toBe("Tag1");

		// 最近の活動が取得できていること
		expect(data.recentActivities.activities).toHaveLength(1);
	});

	it("記事数と閲覧数が正しく取得される", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// createDatabaseClient関数がmockDbを返すように設定
		const { createDatabaseClient } = await import("@saneatsu/db");
		(createDatabaseClient as any).mockReturnValue(mockDb);

		// 総記事数のモック
		const totalArticlesCountMock = {
			from: vi.fn().mockResolvedValue([{ count: 200 }]),
		};

		// 公開済み記事数のモック
		const publishedArticlesCountMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 150 }]),
			}),
		};

		// 下書き記事数のモック
		const draftArticlesCountMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 30 }]),
			}),
		};

		// アーカイブ記事数のモック
		const archivedArticlesCountMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 20 }]),
			}),
		};

		// 総閲覧数のモック（articlesテーブルから取得、言語フィルターなし）
		const totalViewsMock = {
			from: vi.fn().mockResolvedValue([{ totalViews: 10000 }]),
		};

		// 今月の閲覧数のモック
		const thisMonthViewsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ thisMonthViews: 1000 }]),
			}),
		};

		// 人気記事トップ5のモック（空）
		const topArticlesMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			}),
		};

		// 最近の活動のモック（空）
		const recentActivitiesMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			}),
		};

		// selectのモックチェーンを設定
		mockDb.select
			.mockReturnValueOnce(totalArticlesCountMock) // 総記事数
			.mockReturnValueOnce(publishedArticlesCountMock) // 公開済み記事数
			.mockReturnValueOnce(draftArticlesCountMock) // 下書き記事数
			.mockReturnValueOnce(archivedArticlesCountMock) // アーカイブ記事数
			.mockReturnValueOnce(totalViewsMock) // 総閲覧数
			.mockReturnValueOnce(thisMonthViewsMock) // 今月の閲覧数
			.mockReturnValueOnce(topArticlesMock) // 人気記事トップ5
			.mockReturnValueOnce(recentActivitiesMock); // 最近の活動

		// Act
		const app = new OpenAPIHono<{
			Bindings: { TURSO_DATABASE_URL: string; TURSO_AUTH_TOKEN: string };
		}>();
		// @ts-ignore - OpenAPIの型推論エラーを一時的に回避
		app.openapi(getDashboardOverviewRoute, getDashboardOverview);

		const client = testClient(app, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.overview.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		// 記事統計が正しいこと
		expect(data.articleStats.totalArticles).toBe(200);
		expect(data.articleStats.publishedArticles).toBe(150);
		expect(data.articleStats.draftArticles).toBe(30);
		expect(data.articleStats.archivedArticles).toBe(20);
		expect(data.articleStats.totalViews).toBe(10000);
	});
});
