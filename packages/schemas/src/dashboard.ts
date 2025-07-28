import { z } from "zod";
import { dateTimeSchema, idSchema, languageSchema, slugSchema } from "./common";

/**
 * ダッシュボード統計関連のスキーマ定義
 */

/** 記事統計スキーマ */
export const articleStatsSchema = z.object({
	/** 総記事数 */
	totalArticles: z.number().int().min(0),
	/** 公開済み記事数 */
	publishedArticles: z.number().int().min(0),
	/** 下書き記事数 */
	draftArticles: z.number().int().min(0),
	/** アーカイブ記事数 */
	archivedArticles: z.number().int().min(0),
	/** 今月の新規作成記事数 */
	thisMonthArticles: z.number().int().min(0),
	/** 総閲覧数 */
	totalViews: z.number().int().min(0),
	/** 今月の閲覧数 */
	thisMonthViews: z.number().int().min(0),
});

/** タグ統計スキーマ */
export const tagStatsSchema = z.object({
	/** 総タグ数 */
	totalTags: z.number().int().min(0),
	/** 記事数が多いタグトップ5 */
	topTags: z.array(
		z.object({
			id: idSchema,
			slug: slugSchema,
			name: z.string(),
			articleCount: z.number().int().min(0),
		})
	).max(5),
});

/** 人気記事スキーマ */
export const popularArticleSchema = z.object({
	id: idSchema,
	slug: slugSchema,
	title: z.string(),
	viewCount: z.number().int().min(0),
	publishedAt: z.string().datetime().nullable(),
});

/** 人気記事一覧スキーマ */
export const popularArticlesSchema = z.object({
	/** 閲覧数の多い記事トップ10 */
	articles: z.array(popularArticleSchema).max(10),
});

/** 日別統計データスキーマ */
export const dailyStatsSchema = z.object({
	/** 日付（YYYY-MM-DD形式） */
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	/** その日に作成された記事数 */
	articlesCreated: z.number().int().min(0),
	/** その日の閲覧数 */
	views: z.number().int().min(0),
});

/** 時系列統計スキーマ */
export const timeSeriesStatsSchema = z.object({
	/** 過去30日間の日別統計 */
	last30Days: z.array(dailyStatsSchema).max(30),
});

/** ダッシュボード統計クエリパラメータ */
export const dashboardStatsQuerySchema = z.object({
	/** 統計を取得する言語 */
	language: languageSchema.default("ja"),
	/** 時系列データの期間（日数） */
	timeRange: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine(
			(val) => !Number.isNaN(val) && val >= 7 && val <= 90,
			"時系列データの期間は7日から90日の間で指定してください"
		)
		.default("30"),
});

/** ダッシュボード統計レスポンススキーマ */
export const dashboardStatsResponseSchema = z.object({
	/** 記事統計 */
	articleStats: articleStatsSchema,
	/** タグ統計 */
	tagStats: tagStatsSchema,
	/** 人気記事 */
	popularArticles: popularArticlesSchema,
	/** 時系列統計 */
	timeSeriesStats: timeSeriesStatsSchema,
	/** 統計の最終更新日時 */
	lastUpdated: dateTimeSchema,
});

/** 最近の活動アイテムスキーマ */
export const recentActivityItemSchema = z.object({
	/** 活動ID */
	id: idSchema,
	/** 活動タイプ */
	type: z.enum(["article_created", "article_published", "article_updated", "tag_created"]),
	/** 活動の説明 */
	description: z.string(),
	/** 関連記事またはタグのID */
	entityId: idSchema,
	/** 関連記事またはタグのタイトル/名前 */
	entityTitle: z.string(),
	/** 活動が発生した日時 */
	createdAt: dateTimeSchema,
});

/** 最近の活動一覧スキーマ */
export const recentActivitiesSchema = z.object({
	/** 最近の活動（最大20件） */
	activities: z.array(recentActivityItemSchema).max(20),
});

/** ダッシュボード概要レスポンススキーマ */
export const dashboardOverviewResponseSchema = z.object({
	/** 記事統計 */
	articleStats: articleStatsSchema,
	/** タグ統計 */
	tagStats: tagStatsSchema,
	/** 人気記事トップ5 */
	topArticles: z.object({
		articles: z.array(popularArticleSchema).max(5),
	}),
	/** 最近の活動 */
	recentActivities: recentActivitiesSchema,
	/** 統計の最終更新日時 */
	lastUpdated: dateTimeSchema,
});

// 型エクスポート
export type ArticleStats = z.infer<typeof articleStatsSchema>;
export type TagStats = z.infer<typeof tagStatsSchema>;
export type PopularArticle = z.infer<typeof popularArticleSchema>;
export type PopularArticles = z.infer<typeof popularArticlesSchema>;
export type DailyStats = z.infer<typeof dailyStatsSchema>;
export type TimeSeriesStats = z.infer<typeof timeSeriesStatsSchema>;
export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;
export type DashboardStatsResponse = z.infer<typeof dashboardStatsResponseSchema>;
export type RecentActivityItem = z.infer<typeof recentActivityItemSchema>;
export type RecentActivities = z.infer<typeof recentActivitiesSchema>;
export type DashboardOverviewResponse = z.infer<typeof dashboardOverviewResponseSchema>;