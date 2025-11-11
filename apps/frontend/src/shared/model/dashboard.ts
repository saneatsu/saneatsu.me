import type {
	DashboardOverviewResponse,
	DashboardStatsQuery,
	DashboardStatsResponse,
	ArticleStats as SchemaArticleStats,
	ContributionSummary as SchemaContributionSummary,
	PopularArticle as SchemaPopularArticle,
	RecentActivityItem as SchemaRecentActivityItem,
} from "@saneatsu/schemas";

/**
 * ダッシュボード統計クエリ
 */
export interface DashboardStatsRequestQuery {
	/** 統計データを取得する言語 */
	language?: "ja" | "en";
	/** 時系列データの期間（日数、7-90日） */
	timeRange?: string;
}

/**
 * ダッシュボード概要クエリ
 */
export interface DashboardOverviewRequestQuery {
	/** 統計データを取得する言語 */
	language?: "ja" | "en";
}

/**
 * ダッシュボード統計レスポンス（フロントエンド用）
 */
export type DashboardStatsResponseData = DashboardStatsResponse;

/**
 * ダッシュボード概要レスポンス（フロントエンド用）
 */
export type DashboardOverviewResponseData = DashboardOverviewResponse;

/**
 * ダッシュボード統計クエリ（バックエンド用）
 */
export type DashboardStatsBackendQuery = DashboardStatsQuery;

/**
 * フロントエンド用型定義の再エクスポート
 */
export type ArticleStats = SchemaArticleStats;
export type PopularArticle = SchemaPopularArticle;
export type RecentActivityItem = SchemaRecentActivityItem;
export type ContributionSummary = SchemaContributionSummary;
