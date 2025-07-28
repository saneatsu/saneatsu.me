"use client";

import { Eye, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { PopularArticle } from "../../../../shared/types/dashboard";
import { Badge } from "../../../../shared/ui/badge/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";
import { Skeleton } from "../../../../shared/ui/skeleton/skeleton";

/**
 * 人気記事一覧コンポーネントのプロパティ
 */
interface PopularArticlesProps {
	/** 人気記事一覧 */
	articles: PopularArticle[];
	/** ローディング状態 */
	loading?: boolean;
	/** 表示する記事数（デフォルト: 5） */
	limit?: number;
}

/**
 * 人気記事一覧を表示するコンポーネント
 * 閲覧数順に記事をランキング形式で表示
 */
export function PopularArticles({ articles, loading = false, limit = 5 }: PopularArticlesProps) {
	/**
	 * 日付をフォーマットして表示用に変換
	 */
	const formatDate = (dateString: string | null): string => {
		if (!dateString) return "未公開";
		
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 1) {
			return "1日前";
		} else if (diffDays <= 7) {
			return `${diffDays}日前`;
		} else if (diffDays <= 30) {
			const weeks = Math.floor(diffDays / 7);
			return `${weeks}週間前`;
		} else {
			return date.toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		}
	};

	/**
	 * ランキング番号の背景色を取得
	 */
	const getRankingBadgeColor = (index: number): string => {
		switch (index) {
			case 0:
				return "bg-yellow-500 text-white"; // 1位: ゴールド
			case 1:
				return "bg-gray-400 text-white"; // 2位: シルバー
			case 2:
				return "bg-amber-600 text-white"; // 3位: ブロンズ
			default:
				return "bg-muted text-muted-foreground"; // その他
		}
	};

	/**
	 * ローディング中のスケルトン表示
	 */
	const renderSkeleton = () => (
		<div className="space-y-4">
			{Array.from({ length: limit }).map((_, i) => (
				<div key={i} className="flex items-center space-x-4">
					<Skeleton className="h-8 w-8 rounded" />
					<div className="flex-1">
						<Skeleton className="h-4 w-3/4 mb-2" />
						<Skeleton className="h-3 w-1/2" />
					</div>
					<Skeleton className="h-6 w-16" />
				</div>
			))}
		</div>
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center space-x-2">
					<TrendingUp className="h-5 w-5 text-primary" />
					<CardTitle>人気記事ランキング</CardTitle>
				</div>
				<CardDescription>
					閲覧数の多い記事トップ{limit}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					renderSkeleton()
				) : articles.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p>まだ記事がありません</p>
					</div>
				) : (
					<div className="space-y-4">
						{articles.slice(0, limit).map((article, index) => (
							<div
								key={article.id}
								className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
							>
								{/* ランキング番号 */}
								<Badge
									className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankingBadgeColor(index)}`}
								>
									{index + 1}
								</Badge>

								{/* 記事情報 */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center space-x-2">
										<h3 className="font-medium text-sm text-foreground truncate">
											{article.title}
										</h3>
										<Link
											href={`/articles/${article.slug}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-primary"
										>
											<ExternalLink className="h-3 w-3" />
										</Link>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{formatDate(article.publishedAt)}
									</p>
								</div>

								{/* 閲覧数 */}
								<div className="flex items-center space-x-1 text-muted-foreground">
									<Eye className="h-4 w-4" />
									<span className="text-sm font-medium">
										{article.viewCount.toLocaleString()}
									</span>
								</div>
							</div>
						))}
					</div>
				)}

				{/* 全体を見るリンク */}
				{!loading && articles.length > 0 && (
					<div className="mt-4 pt-4 border-t">
						<Link
							href="/admin/articles"
							className="text-sm text-primary hover:text-primary/80 font-medium"
						>
							すべての記事を見る →
						</Link>
					</div>
				)}
			</CardContent>
		</Card>
	);
}