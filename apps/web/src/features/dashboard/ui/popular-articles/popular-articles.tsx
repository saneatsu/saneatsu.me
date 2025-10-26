"use client";

import { ExternalLink, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";

import type { PopularArticle } from "@/shared/model/dashboard";
import { Badge } from "@/shared/ui/badge/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card/card";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table/table";

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
	/** 選択された日数 */
	selectedDays?: 30 | 90 | 180 | 360;
	/** Cardを表示しないオプション */
	hideCard?: boolean;
}

/**
 * 人気記事一覧を表示するコンポーネント
 * 閲覧数順に記事をランキング形式で表示
 */
export function PopularArticles({
	articles,
	loading = false,
	limit = 5,
	selectedDays = 30,
	hideCard = false,
}: PopularArticlesProps) {
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
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[60px]">順位</TableHead>
					<TableHead>記事タイトル</TableHead>
					<TableHead className="w-[150px]">公開日</TableHead>
					<TableHead className="w-[120px] text-right">閲覧数</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: limit }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton components don't reorder
					<TableRow key={i}>
						<TableCell>
							<Skeleton className="h-8 w-8 rounded-full" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[400px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[100px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[80px] ml-auto" />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);

	const content = (
		<>
			{loading ? (
				renderSkeleton()
			) : articles.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					<TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
					<p>まだ記事がありません</p>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[60px]">順位</TableHead>
							<TableHead>記事タイトル</TableHead>
							<TableHead className="w-[150px]">公開日</TableHead>
							<TableHead className="w-[120px] text-right">閲覧数</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{articles.slice(0, limit).map((article, index) => (
							<TableRow key={article.id}>
								<TableCell>
									<Badge
										className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankingBadgeColor(index)}`}
									>
										{index + 1}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex items-center space-x-2">
										<h3 className="font-medium text-sm text-foreground max-w-lg truncate">
											{article.title}
										</h3>
										<Link
											href={`/blog/${article.slug}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-primary flex-shrink-0"
										>
											<ExternalLink className="h-3 w-3" />
										</Link>
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{formatDate(article.publishedAt)}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end space-x-1 text-muted-foreground">
										<Eye className="h-4 w-4" />
										<span className="font-medium">
											{article.viewCount?.toLocaleString() ?? "0"}
										</span>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</>
	);

	if (hideCard) {
		return content;
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center space-x-2">
					<TrendingUp className="h-5 w-5 text-primary" />
					<CardTitle>人気記事ランキング</CardTitle>
				</div>
				<CardDescription>
					過去{selectedDays}日間の閲覧数の多い記事トップ{limit}
				</CardDescription>
			</CardHeader>
			<CardContent>{content}</CardContent>
		</Card>
	);
}
