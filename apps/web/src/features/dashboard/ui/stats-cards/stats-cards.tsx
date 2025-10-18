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
			<Card className="h-full">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-md font-bold">総閲覧数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-1">
						<span className="text-2xl font-bold text-primary leading-none">
							{loading
								? "-"
								: (articleStats?.totalViews?.toLocaleString() ?? "0")}
						</span>
						{!loading && (
							<span className="text-sm font-bold text-primary leading-none pb-[2px]">
								回
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 今月の閲覧数 */}
			<Card className="h-full">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-md font-bold">今月の閲覧数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-1">
						<span className="text-2xl font-bold text-primary leading-none">
							{loading
								? "-"
								: (articleStats?.thisMonthViews?.toLocaleString() ?? "0")}
						</span>
						{!loading && (
							<span className="text-sm font-bold text-primary leading-none pb-[2px]">
								回
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 総記事数カード */}
			<Card className="h-full">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-md font-bold">総記事数</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-1">
						{loading ? (
							<span className="text-2xl font-bold text-primary leading-none">
								-（- + - + -）
							</span>
						) : (
							<>
								<span className="text-2xl font-bold text-primary leading-none">
									{formatNumber(articleStats.totalArticles)}
								</span>
								<span className="text-sm font-bold text-primary leading-none pb-[2px]">
									記事
								</span>
								<span className="self-center text-sm font-bold text-primary leading-none">
									（
								</span>
								<Badge variant="success" className="text-sm leading-none">
									{articleStats.publishedArticles}
								</Badge>
								<span className="self-center text-sm font-bold text-primary leading-none">
									+
								</span>
								<Badge variant="secondary" className="text-sm leading-none">
									{articleStats.draftArticles}
								</Badge>
								<span className="self-center text-sm font-bold text-primary leading-none">
									+
								</span>
								<Badge variant="destructive" className="text-sm leading-none">
									{articleStats.archivedArticles}
								</Badge>
								<span className="self-center text-sm font-bold text-primary leading-none">
									）
								</span>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 今月の新規記事 */}
			<Card className="h-full">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-md font-bold">今月の新規記事</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-1">
						<span className="text-2xl font-bold text-primary leading-none">
							{loading ? "-" : articleStats.thisMonthArticles}
						</span>
						{!loading && (
							<span className="text-sm font-bold text-primary leading-none pb-[2px]">
								記事
							</span>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
