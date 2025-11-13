"use client";

import type { ArticleStats } from "@/shared/model/dashboard";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

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

	return (
		<div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
			{/* 総閲覧数 */}
			<Card className="h-full flex flex-col shadow-none">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-normal text-muted-foreground">
						総閲覧数
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col justify-end items-end">
					<div className="flex items-end gap-1">
						<span className="text-2xl font-bold text-primary leading-none">
							{loading
								? "-"
								: (articleStats?.totalViews?.toLocaleString() ?? "0")}
						</span>
						{!loading && (
							<span className="text-sm font-bold text-primary leading-none pb-0.5">
								回
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 今月の閲覧数 */}
			<Card className="h-full flex flex-col shadow-none">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-normal text-muted-foreground">
						今月の閲覧数
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col justify-end items-end">
					<div className="flex flex-col gap-1">
						<div className="flex items-end gap-1">
							<span className="text-2xl font-bold text-primary leading-none">
								{loading
									? "-"
									: (articleStats?.thisMonthViews?.toLocaleString() ?? "0")}
							</span>
							{!loading && (
								<span className="text-sm font-bold text-primary leading-none pb-0.5">
									回
								</span>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 総記事数カード */}
			<Card className="h-full flex flex-col gap-2 shadow-none">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-normal text-muted-foreground">
						総記事数
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col justify-end items-end">
					{loading ? (
						<div className="flex flex-col gap-1 items-end">
							<div className="flex items-end gap-1 justify-end">
								<span className="text-2xl font-bold text-primary leading-none">
									-
								</span>
								<span className="text-sm font-bold text-primary leading-none pb-0.5">
									記事
								</span>
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-1 items-end">
							{/* 1行目: 内訳 */}
							<div className="flex items-center gap-1 justify-end">
								<Badge variant="success" className="text-xs leading-none">
									{articleStats.publishedArticles}
								</Badge>
								<span className="text-xs font-bold text-primary leading-none">
									+
								</span>
								<Badge variant="secondary" className="text-xs leading-none">
									{articleStats.draftArticles}
								</Badge>
								<span className="text-xs font-bold text-primary leading-none">
									+
								</span>
								<Badge variant="destructive" className="text-xs leading-none">
									{articleStats.archivedArticles}
								</Badge>
							</div>
							{/* 2行目: 総記事数 */}
							<div className="flex items-end gap-1 justify-end">
								<span className="text-2xl font-bold text-primary leading-none">
									{formatNumber(articleStats.totalArticles)}
								</span>
								<span className="text-sm font-bold text-primary leading-none pb-0.5">
									記事
								</span>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* 今月の新規記事 */}
			<Card className="h-full flex flex-col shadow-none">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-normal text-muted-foreground">
						今月の新規記事
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col justify-end items-end">
					<div className="flex items-end gap-1">
						<span className="text-2xl font-bold text-primary leading-none">
							{loading ? "-" : articleStats.thisMonthArticles}
						</span>
						{!loading && (
							<span className="text-sm font-bold text-primary leading-none pb-0.5">
								記事
							</span>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
