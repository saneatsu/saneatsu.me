"use client";

import { Hash, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { TagStats } from "../../../../shared/types/dashboard";
import { Badge } from "../../../../shared/ui/badge/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";
import { Progress } from "../../../../shared/ui/progress/progress";
import { Skeleton } from "../../../../shared/ui/skeleton/skeleton";

/**
 * 人気タグ一覧コンポーネントのプロパティ
 */
interface PopularTagsProps {
	/** タグ統計データ */
	tagStats: TagStats;
	/** ローディング状態 */
	loading?: boolean;
}

/**
 * 人気タグ一覧を表示するコンポーネント
 * 記事数の多いタグを使用頻度と共に表示
 */
export function PopularTags({ tagStats, loading = false }: PopularTagsProps) {
	// 最大記事数を取得（プログレスバーの基準値として使用）
	const maxArticleCount = Math.max(
		...tagStats.topTags.map(
			(tag: { articleCount: number }) => tag.articleCount
		),
		1
	);

	/**
	 * タグの色をインデックスに基づいて取得
	 */
	const getTagColor = (index: number): string => {
		const colors = [
			"bg-blue-100 text-blue-800",
			"bg-green-100 text-green-800",
			"bg-purple-100 text-purple-800",
			"bg-yellow-100 text-yellow-800",
			"bg-pink-100 text-pink-800",
		];
		return colors[index % colors.length];
	};

	/**
	 * ローディング中のスケルトン表示
	 */
	const renderSkeleton = () => (
		<div className="space-y-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="flex items-center space-x-4">
					<Skeleton className="h-6 w-20" />
					<div className="flex-1">
						<Skeleton className="h-2 w-full mb-2" />
						<Skeleton className="h-3 w-1/3" />
					</div>
					<Skeleton className="h-4 w-8" />
				</div>
			))}
		</div>
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center space-x-2">
					<Hash className="h-5 w-5 text-primary" />
					<CardTitle>人気タグ</CardTitle>
				</div>
				<CardDescription>記事数の多いタグトップ5</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					renderSkeleton()
				) : tagStats.topTags.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p>まだタグがありません</p>
					</div>
				) : (
					<div className="space-y-4">
						{tagStats.topTags.map(
							(
								tag: {
									id: number;
									slug: string;
									name: string;
									articleCount: number;
								},
								index: number
							) => {
								const progressValue =
									(tag.articleCount / maxArticleCount) * 100;

								return (
									<div
										key={tag.id}
										className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
									>
										{/* タグ名 */}
										<Badge
											className={`${getTagColor(index)} font-medium px-3 py-1`}
										>
											# {tag.name}
										</Badge>

										{/* プログレスバーとカウント */}
										<div className="flex-1">
											<div className="flex items-center justify-between mb-2">
												<span className="text-sm text-muted-foreground">
													{tag.slug}
												</span>
												<span className="text-sm font-medium text-foreground">
													{tag.articleCount}記事
												</span>
											</div>
											<Progress value={progressValue} className="h-2" />
										</div>

										{/* 順位 */}
										<div className="flex items-center text-muted-foreground">
											<TrendingUp className="h-4 w-4 mr-1" />
											<span className="text-sm font-medium">#{index + 1}</span>
										</div>
									</div>
								);
							}
						)}
					</div>
				)}

				{/* 統計サマリー */}
				{!loading && tagStats.topTags.length > 0 && (
					<div className="mt-6 pt-4 border-t">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								総タグ数: {tagStats.totalTags}
							</span>
							<Link
								href="/admin/tags"
								className="text-primary hover:text-primary/80 font-medium"
							>
								すべてのタグを見る →
							</Link>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
