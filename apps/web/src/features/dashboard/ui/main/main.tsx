"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "../../../../shared/ui/alert/alert";
import { Button } from "../../../../shared/ui/button/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";
import { useDashboardOverview } from "../../api/use-dashboard-overview";
import { PopularArticles } from "../popular-articles";
import { RecentActivities } from "../recent-activities";
import { DetailedStatsCards, StatsCards } from "../stats-cards";
import { ViewsTrendChart } from "../views-trend-chart";

/**
 * ダッシュボードメインコンポーネントのプロパティ
 */
interface DashboardMainProps {
	/** ユーザー名（表示用） */
	userName?: string;
}

/**
 * ダッシュボードのメインコンポーネント
 * 各種統計データを取得し、サブコンポーネントに渡して表示
 */
export function DashboardMain({ userName = "管理者" }: DashboardMainProps) {
	/**
	 * ダッシュボード概要データを取得
	 */
	const {
		data: dashboardData,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = useDashboardOverview({ language: "ja" });

	/**
	 * 最終更新日時をフォーマット
	 */
	const formatLastUpdated = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	/**
	 * エラー状態の表示
	 */
	if (error) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold text-foreground mb-2">
						ダッシュボード
					</h1>
					<p className="text-muted-foreground">ようこそ、{userName}さん</p>
				</div>

				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="flex items-center justify-between">
						<span>
							ダッシュボードデータの取得に失敗しました。ネットワーク接続を確認してください。
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => refetch()}
							disabled={isRefetching}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
							/>
							再試行
						</Button>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground mb-2">
						ダッシュボード
					</h1>
					<p className="text-muted-foreground">
						ようこそ、{userName}さん。ここから記事の管理ができます。
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isRefetching}
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
						/>
						更新
					</Button>
				</div>
			</div>

			{/* 最終更新時刻 */}
			{dashboardData && !isLoading && (
				<div className="text-sm text-muted-foreground">
					最終更新: {formatLastUpdated(dashboardData.lastUpdated)}
				</div>
			)}

			{/* 閲覧数推移グラフ */}
			<ViewsTrendChart />

			{/* メイン統計カード */}
			<StatsCards
				articleStats={
					dashboardData?.articleStats || {
						totalArticles: 0,
						publishedArticles: 0,
						draftArticles: 0,
						archivedArticles: 0,
						thisMonthArticles: 0,
						totalViews: 0,
						thisMonthViews: 0,
					}
				}
				loading={isLoading}
			/>

			{/* 詳細統計カード */}
			<DetailedStatsCards
				articleStats={
					dashboardData?.articleStats || {
						totalArticles: 0,
						publishedArticles: 0,
						draftArticles: 0,
						archivedArticles: 0,
						thisMonthArticles: 0,
						totalViews: 0,
						thisMonthViews: 0,
					}
				}
				loading={isLoading}
			/>

			{/* グリッドレイアウト：人気記事・最近の活動 */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* 人気記事 */}
				<PopularArticles
					articles={dashboardData?.topArticles.articles || []}
					loading={isLoading}
					limit={5}
				/>

				{/* 最近の活動 */}
				<RecentActivities
					activities={dashboardData?.recentActivities.activities || []}
					loading={isLoading}
					limit={8}
				/>
			</div>

			{/* クイックアクション */}
			<Card>
				<CardHeader>
					<CardTitle>クイックアクション</CardTitle>
					<CardDescription>よく使用する機能へのショートカット</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 md:grid-cols-2">
						<Button asChild className="justify-start">
							<a href="/admin/articles/new">新しい記事を作成</a>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<a href="/admin/articles">記事一覧を見る</a>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
