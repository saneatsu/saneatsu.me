"use client";

import { Activity, FileText, Hash, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { RecentActivityItem } from "../../../../shared/types/dashboard";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";
import { Skeleton } from "../../../../shared/ui/skeleton/skeleton";

/**
 * 最近の活動コンポーネントのプロパティ
 */
interface RecentActivitiesProps {
	/** 活動一覧 */
	activities: RecentActivityItem[];
	/** ローディング状態 */
	loading?: boolean;
	/** 表示する活動数（デフォルト: 10） */
	limit?: number;
}

/**
 * 最近の活動を表示するコンポーネント
 * 記事作成、更新、公開などの活動ログを時系列で表示
 */
export function RecentActivities({
	activities,
	loading = false,
	limit = 10,
}: RecentActivitiesProps) {
	/**
	 * 活動タイプに応じたアイコンとスタイルを取得
	 */
	const getActivityStyle = (type: RecentActivityItem["type"]) => {
		switch (type) {
			case "article_created":
				return {
					icon: <Plus className="h-4 w-4" />,
					color: "text-blue-600",
					bgColor: "bg-blue-100",
				};
			case "article_published":
				return {
					icon: <TrendingUp className="h-4 w-4" />,
					color: "text-green-600",
					bgColor: "bg-green-100",
				};
			case "article_updated":
				return {
					icon: <FileText className="h-4 w-4" />,
					color: "text-yellow-600",
					bgColor: "bg-yellow-100",
				};
			case "tag_created":
				return {
					icon: <Hash className="h-4 w-4" />,
					color: "text-purple-600",
					bgColor: "bg-purple-100",
				};
			default:
				return {
					icon: <Activity className="h-4 w-4" />,
					color: "text-gray-600",
					bgColor: "bg-gray-100",
				};
		}
	};

	/**
	 * 活動タイプに応じた日本語ラベルを取得
	 */
	const getActivityLabel = (type: RecentActivityItem["type"]): string => {
		switch (type) {
			case "article_created":
				return "記事作成";
			case "article_published":
				return "記事公開";
			case "article_updated":
				return "記事更新";
			case "tag_created":
				return "タグ作成";
			default:
				return "不明な活動";
		}
	};

	/**
	 * 日時をフォーマットして表示用に変換
	 */
	const formatDateTime = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffMinutes = Math.floor(diffTime / (1000 * 60));
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMinutes < 60) {
			return `${diffMinutes}分前`;
		} else if (diffHours < 24) {
			return `${diffHours}時間前`;
		} else if (diffDays < 7) {
			return `${diffDays}日前`;
		} else {
			return date.toLocaleDateString("ja-JP", {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		}
	};

	/**
	 * ローディング中のスケルトン表示
	 */
	const renderSkeleton = () => (
		<div className="space-y-4">
			{Array.from({ length: limit }).map((_, i) => (
				<div key={i} className="flex items-start space-x-3">
					<Skeleton className="h-8 w-8 rounded-full mt-1" />
					<div className="flex-1">
						<Skeleton className="h-4 w-3/4 mb-1" />
						<Skeleton className="h-3 w-1/2 mb-2" />
						<Skeleton className="h-3 w-1/4" />
					</div>
				</div>
			))}
		</div>
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center space-x-2">
					<Activity className="h-5 w-5 text-primary" />
					<CardTitle>最近の活動</CardTitle>
				</div>
				<CardDescription>最新の記事やタグ関連の活動</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					renderSkeleton()
				) : activities.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p>まだ活動がありません</p>
					</div>
				) : (
					<div className="space-y-4">
						{activities.slice(0, limit).map((activity) => {
							const style = getActivityStyle(activity.type);
							const label = getActivityLabel(activity.type);

							return (
								<div
									key={activity.id}
									className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
								>
									{/* アクティビティアイコン */}
									<div
										className={`flex items-center justify-center w-8 h-8 rounded-full ${style.bgColor} ${style.color} flex-shrink-0 mt-1`}
									>
										{style.icon}
									</div>

									{/* アクティビティ内容 */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2 mb-1">
											<span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
												{label}
											</span>
										</div>
										<p className="text-sm text-foreground">
											{activity.description}
										</p>
										<div className="flex items-center justify-between mt-2">
											<Link
												href={
													activity.type.startsWith("article_")
														? `/admin/articles`
														: `/admin/tags`
												}
												className="text-sm text-primary hover:text-primary/80 font-medium truncate"
											>
												{activity.entityTitle}
											</Link>
											<span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
												{formatDateTime(activity.createdAt)}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* すべて見るリンク */}
				{!loading && activities.length > limit && (
					<div className="mt-4 pt-4 border-t">
						<button
							type="button"
							className="text-sm text-primary hover:text-primary/80 font-medium"
						>
							すべての活動を見る →
						</button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
