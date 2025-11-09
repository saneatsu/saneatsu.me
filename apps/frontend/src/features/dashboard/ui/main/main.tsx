"use client";

import { AlertCircle, BarChart3, ExternalLink } from "lucide-react";
import { useState } from "react";

import {
	PopularArticles,
	StatsCards,
	useDashboardOverview,
	ViewsTrendChart,
} from "@/features/dashboard";
import { AmazonLogo, RakutenLogo } from "@/shared/image";
import { Alert, AlertDescription } from "@/shared/ui/alert/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select/select";

/**
 * ダッシュボードのメインコンポーネント
 * 各種統計データを取得し、サブコンポーネントに渡して表示
 */
export function DashboardMain() {
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
			{/* アフィリエイトレポートリンクと最終更新時刻 */}
			{dashboardData && !isLoading && (
				<div className="space-y-3">
					{/* アフィリエイトレポートカード */}
					<div className="flex flex-col sm:flex-row items-stretch gap-3">
						{/* 楽天アフィリエイトレポート */}
						<a
							href="https://affiliate.rakuten.co.jp/report/summary"
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-br from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 p-4"
						>
							<div className="flex items-center justify-between gap-3">
								<span className="text-sm font-medium">
									楽天アフィリエイトレポート
								</span>
								<div className="bg-[#BF0000] hover:bg-[#BF0000]/90 text-white px-3 py-1.5 rounded-md text-sm font-medium shrink-0 flex items-center gap-1.5 transition-colors">
									<RakutenLogo className="w-4 h-4" />
									<span>開く</span>
									<ExternalLink className="h-3.5 w-3.5" />
								</div>
							</div>
						</a>

						{/* Amazonアソシエイト */}
						<a
							href="https://affiliate.amazon.co.jp/p/reporting/earnings"
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-950/20 p-4"
						>
							<div className="flex items-center justify-between gap-3">
								<span className="text-sm font-medium">Amazonアソシエイト</span>
								<div className="bg-[#FF9900] hover:bg-[#FF9900]/90 text-white px-3 py-1.5 rounded-md text-sm font-medium shrink-0 flex items-center gap-1.5 transition-colors">
									<AmazonLogo className="w-4 h-4" />
									<span>開く</span>
									<ExternalLink className="h-3.5 w-3.5" />
								</div>
							</div>
						</a>
					</div>

					{/* 最終更新時刻 */}
					<div className="text-sm text-muted-foreground text-right">
						最終更新: {formatLastUpdated(dashboardData.lastUpdated)}
					</div>
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
