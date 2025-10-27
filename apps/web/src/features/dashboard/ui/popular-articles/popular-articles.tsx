"use client";

import { ExternalLink, Eye, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getArticleEmoji, getImageUrl } from "@/shared/lib";
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
	 *
	 * @description
	 * YYYY/MM/DD HH:MM 形式で表示
	 */
	const formatDate = (dateString: string | null): string => {
		if (!dateString) return "未設定";

		try {
			const date = new Date(dateString);
			return new Intl.DateTimeFormat("ja-JP", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			}).format(date);
		} catch {
			return "無効な日付";
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
					<TableHead>記事</TableHead>
					<TableHead className="w-[200px]">タグ</TableHead>
					<TableHead className="w-[120px] text-right">閲覧数</TableHead>
					<TableHead className="w-[180px]">公開日</TableHead>
					<TableHead className="w-[180px]">更新日</TableHead>
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
							<div className="flex items-center space-x-3">
								<Skeleton className="h-12 w-20 rounded-md" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-[300px]" />
									<Skeleton className="h-3 w-[200px]" />
								</div>
							</div>
						</TableCell>
						<TableCell>
							<Skeleton className="h-6 w-[100px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[80px] ml-auto" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[140px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[140px]" />
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
							<TableHead>記事</TableHead>
							<TableHead className="w-[200px]">タグ</TableHead>
							<TableHead className="w-[120px] text-right">閲覧数</TableHead>
							<TableHead className="w-[180px]">公開日</TableHead>
							<TableHead className="w-[180px]">更新日</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{articles.slice(0, limit).map((article, index) => (
							<TableRow key={article.id}>
								{/* 順位 */}
								<TableCell>
									<Badge
										className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankingBadgeColor(index)}`}
									>
										{index + 1}
									</Badge>
								</TableCell>

								{/* 記事（サムネイル + タイトル + slug） */}
								<TableCell>
									<div className="flex items-center space-x-3">
										{/* サムネイル */}
										<div className="relative w-20 aspect-video overflow-hidden rounded-md bg-muted flex-shrink-0">
											{article.cfImageId ? (
												<Image
													src={getImageUrl(article.cfImageId, "small")}
													alt={article.title || "記事のサムネイル"}
													fill
													className="object-cover"
													sizes="80px"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center">
													<span className="text-3xl">
														{getArticleEmoji(article.id)}
													</span>
												</div>
											)}
										</div>

										{/* タイトル + slug */}
										<div className="space-y-1 min-w-[200px]">
											<div className="flex items-center space-x-2">
												<Link
													href={`/admin/articles/${article.id}/edit`}
													className="font-medium text-sm hover:text-primary hover:underline transition-colors"
												>
													{article.title}
												</Link>
												<Link
													href={`/blog/${article.slug}`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-muted-foreground hover:text-primary flex-shrink-0"
												>
													<ExternalLink className="h-3 w-3" />
												</Link>
											</div>
											<div className="text-sm text-muted-foreground">
												{article.slug}
											</div>
										</div>
									</div>
								</TableCell>

								{/* タグ */}
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{article.tags && article.tags.length > 0 ? (
											article.tags.map((tag) => (
												<Badge
													key={tag.id}
													variant="outline"
													className="text-xs"
												>
													{tag.translations.ja}
												</Badge>
											))
										) : (
											<span className="text-sm text-muted-foreground">-</span>
										)}
									</div>
								</TableCell>

								{/* 閲覧数 */}
								<TableCell className="text-right">
									<div className="flex items-center justify-end space-x-1 text-muted-foreground">
										<Eye className="h-4 w-4" />
										<span className="font-medium">
											{article.viewCount?.toLocaleString() ?? "0"}
										</span>
									</div>
								</TableCell>

								{/* 公開日 */}
								<TableCell className="text-sm text-muted-foreground">
									{formatDate(article.publishedAt)}
								</TableCell>

								{/* 更新日 */}
								<TableCell className="text-sm text-muted-foreground">
									{formatDate(article.updatedAt)}
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
