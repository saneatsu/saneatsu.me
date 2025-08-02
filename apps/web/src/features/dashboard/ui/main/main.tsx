"use client";

import { AlertCircle, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "../../../../shared/ui/alert/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../shared/ui/select/select";
import { useDashboardOverview } from "../../api/use-dashboard-overview";
import { PopularArticles } from "../popular-articles";
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
	 * 選択された日数の状態管理
	 */
	const [selectedDays, setSelectedDays] = useState<30 | 90 | 180 | 360>(30);

	/**
	 * ダッシュボード概要データを取得
	 */
	const {
		data: dashboardData,
		isLoading,
		error,
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
					<AlertDescription>
						ダッシュボードデータの取得に失敗しました。ネットワーク接続を確認してください。
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div>
				<h1 className="text-3xl font-bold text-foreground mb-2">
					ダッシュボード
				</h1>
				<p className="text-muted-foreground">
					ようこそ、{userName}さん。ここから記事の管理ができます。
				</p>
			</div>

			{/* 最終更新時刻 */}
			{dashboardData && !isLoading && (
				<div className="text-sm text-muted-foreground">
					最終更新: {formatLastUpdated(dashboardData.lastUpdated)}
				</div>
			)}

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

			{/* 期間分析セクション */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<BarChart3 className="h-5 w-5 text-primary" />
							<div>
								<CardTitle>期間分析</CardTitle>
								<CardDescription>
									選択した期間の閲覧データと人気記事
								</CardDescription>
							</div>
						</div>
						<Select
							value={selectedDays.toString()}
							onValueChange={(value) =>
								setSelectedDays(
									Number.parseInt(value, 10) as 30 | 90 | 180 | 360
								)
							}
						>
							<SelectTrigger className="w-[120px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="30">30日</SelectItem>
								<SelectItem value="90">90日</SelectItem>
								<SelectItem value="180">180日</SelectItem>
								<SelectItem value="360">360日</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* 閲覧数推移グラフ */}
					<ViewsTrendChart selectedDays={selectedDays} hideCard={true} />

					{/* 人気記事ランキング */}
					<PopularArticles
						articles={dashboardData?.topArticles.articles || []}
						loading={isLoading}
						limit={10}
						selectedDays={selectedDays}
						hideCard={true}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
