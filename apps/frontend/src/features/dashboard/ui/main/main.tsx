"use client";

import { AlertCircle, BarChart3, ExternalLink } from "lucide-react";
import { createParser, useQueryState } from "nuqs";

import type { ContributionCopy } from "@/features/contributions";
import {
	ContributionHeatmap,
	useDashboardContributions,
} from "@/features/contributions";
import {
	PopularArticles,
	StatsCards,
	useDashboardOverview,
	ViewsTrendChart,
} from "@/features/dashboard";
import { AmazonLogo, GoogleLogo, RakutenLogo } from "@/shared/image";
import {
	Alert,
	AlertDescription,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui";

const DASHBOARD_PERIODS = [30, 90, 180, 360] as const;
type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

const DASHBOARD_CONTRIBUTION_COPY: ContributionCopy = {
	title: "執筆アクティビティ",
	subtitle: "直近365日の日本語文字数",
	rangeLabel: (days) => `直近${days}日`,
	summaryTotalJaChars: "文字数（日本語）",
	summaryCurrentStreak: "連続日数",
	legendLess: "少ない",
	legendMore: "多い",
	error: "執筆データの取得に失敗しました",
	retry: "再読み込み",
	metricJaCharsUnit: "文字",
};

const isDashboardPeriod = (value: number): value is DashboardPeriod =>
	DASHBOARD_PERIODS.includes(value as DashboardPeriod);

const dashboardPeriodParser = createParser<DashboardPeriod>({
	parse(value) {
		const parsed = Number.parseInt(value, 10);
		return isDashboardPeriod(parsed) ? parsed : null;
	},
	serialize(value) {
		return value.toString();
	},
})
	.withDefault(30)
	.withOptions({
		history: "replace",
		clearOnDefault: true,
	});

/**
 * ダッシュボードのメインコンポーネント
 * 各種統計データを取得し、サブコンポーネントに渡して表示
 */
export function DashboardMain() {
	/**
	 * 選択された日数の状態管理（URLクエリと同期）
	 */
	const [selectedDays, setSelectedDays] = useQueryState(
		"days",
		dashboardPeriodParser
	);

	const handlePeriodChange = (value: string) => {
		const period = Number.parseInt(value, 10);
		if (!isDashboardPeriod(period)) return;
		void setSelectedDays(period);
	};

	/**
	 * ダッシュボード概要データを取得
	 */
	const {
		data: dashboardData,
		isLoading,
		error,
	} = useDashboardOverview({ language: "ja" });

	const {
		data: contributionSummary,
		isLoading: contributionsLoading,
		error: contributionError,
		refetch: refetchContributionSummary,
	} = useDashboardContributions({ language: "ja" });

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
					<div className="flex flex-1 justify-between items-center">
						<div className="flex flex-col sm:flex-row items-stretch gap-3">
							{/* Google Analytics */}
							<a
								href="https://analytics.google.com/analytics/web"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="border border-brand-google text-brand-google hover:bg-brand-google/10 px-3 py-1.5 rounded-md text-sm font-medium shrink-0 flex items-center gap-1.5 transition-colors">
									<GoogleLogo className="w-4 h-4" />
									<span>Google Analytics</span>
									<ExternalLink className="h-3.5 w-3.5" />
								</div>
							</a>

							{/* Amazonアソシエイト */}
							<a
								href="https://affiliate.amazon.co.jp/p/reporting/earnings"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="border border-brand-amazon text-brand-amazon hover:bg-brand-amazon/10 px-3 py-1.5 rounded-md text-sm font-medium shrink-0 flex items-center gap-1.5 transition-colors">
									<AmazonLogo className="w-4 h-4" />
									<span>Amazonアソシエイト</span>
									<ExternalLink className="h-3.5 w-3.5" />
								</div>
							</a>

							{/* 楽天アフィリエイトレポート */}
							<a
								href="https://affiliate.rakuten.co.jp/report/summary"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="border border-brand-rakuten text-brand-rakuten hover:bg-brand-rakuten/10 px-3 py-1.5 rounded-md text-sm font-medium shrink-0 flex items-center gap-1.5 transition-colors">
									<RakutenLogo className="w-4 h-4" />
									<span>楽天アフィリエイトレポート</span>
									<ExternalLink className="h-3.5 w-3.5" />
								</div>
							</a>
						</div>

						{/* 最終更新時刻 */}
						<div className="text-sm text-muted-foreground text-right">
							最終更新: {formatLastUpdated(dashboardData.lastUpdated)}
						</div>
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

			<ContributionHeatmap
				summary={contributionSummary}
				isLoading={contributionsLoading}
				error={contributionError}
				onRetry={() => {
					void refetchContributionSummary();
				}}
				copy={DASHBOARD_CONTRIBUTION_COPY}
				locale="ja-JP"
				rangeDays={contributionSummary?.days.length ?? 365}
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
							onValueChange={handlePeriodChange}
						>
							<SelectTrigger className="w-[120px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{DASHBOARD_PERIODS.map((period) => (
									<SelectItem key={period} value={period.toString()}>
										{period}日
									</SelectItem>
								))}
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
