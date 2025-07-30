"use client";

import { BarChart3, Eye, FileText, TrendingUp } from "lucide-react";
import type { ArticleStats } from "../../../../shared/types/dashboard";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";

/**
 * 統計カードコンポーネントのプロパティ
 */
interface StatsCardsProps {
	/** 記事統計データ */
	articleStats: ArticleStats;
	/** ローディング状態 */
	loading?: boolean;
}

/**
 * 統計データを表示するカードコンポーネント
 * ダッシュボードのトップに表示される主要な統計情報
 */
export function StatsCards({ articleStats, loading = false }: StatsCardsProps) {
	/**
	 * 数値をフォーマットして表示用に変換
	 */
	const formatNumber = (num: number): string => {
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}k`;
		}
		return num.toString();
	};

	/**
	 * 統計カードの共通レンダリング関数
	 */
	const renderStatCard = (
		title: string,
		value: number,
		subtitle: string,
		icon: React.ReactNode,
		colorClass: string
	) => (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<div className={`h-4 w-4 ${colorClass}`}>{icon}</div>
			</CardHeader>
			<CardContent>
				<div className={`text-2xl font-bold ${colorClass}`}>
					{loading ? "-" : formatNumber(value)}
				</div>
				<p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
			</CardContent>
		</Card>
	);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{/* 総記事数 */}
			{renderStatCard(
				"総記事数",
				articleStats.totalArticles,
				"全記事（全ステータス含む）",
				<FileText className="h-4 w-4" />,
				"text-primary"
			)}

			{/* 公開済み記事数 */}
			{renderStatCard(
				"公開済み記事",
				articleStats.publishedArticles,
				"一般に公開されている記事",
				<TrendingUp className="h-4 w-4" />,
				"text-green-600"
			)}

			{/* 下書き記事数 */}
			{renderStatCard(
				"下書き記事",
				articleStats.draftArticles,
				"未公開の記事",
				<BarChart3 className="h-4 w-4" />,
				"text-yellow-600"
			)}
		</div>
	);
}

/**
 * 詳細統計カードコンポーネント
 * より詳細な統計情報を表示（閲覧数、今月の数値など）
 */
export function DetailedStatsCards({
	articleStats,
	loading = false,
}: {
	articleStats: ArticleStats;
	loading?: boolean;
}) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
			{/* 総閲覧数 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">総閲覧数</CardTitle>
					<Eye className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-primary">
						{loading ? "-" : articleStats.totalViews.toLocaleString()}
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						全記事の累計閲覧数
					</p>
				</CardContent>
			</Card>

			{/* 今月の新規記事 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">今月の新規記事</CardTitle>
					<TrendingUp className="h-4 w-4 text-emerald-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-emerald-600">
						{loading ? "-" : articleStats.thisMonthArticles}
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						{new Date().getMonth() + 1}月に作成された記事
					</p>
				</CardContent>
			</Card>

			{/* アーカイブ記事数 */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">アーカイブ記事</CardTitle>
					<BarChart3 className="h-4 w-4 text-gray-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-gray-600">
						{loading ? "-" : articleStats.archivedArticles}
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						アーカイブされた記事
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
