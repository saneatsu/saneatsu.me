"use client";

import { useLocale } from "next-intl";

import { ArticleCard, useGetAllArticles } from "@/entities/article";

/**
 * 人気記事一覧ウィジェット
 *
 * @description
 * 閲覧数の多い記事トップ10をカード形式で一覧表示するウィジェット。
 * ページネーションやタグフィルターは不要で、常に閲覧数順（降順）で表示。
 */
export function PopularArticlesList() {
	const locale = useLocale();

	const {
		data: articlesResponse,
		isLoading: loading,
		error,
		refetch,
	} = useGetAllArticles({
		page: 1,
		language: locale as "ja" | "en",
		limit: 10, // トップ10を表示
		status: ["published"],
		sortBy: "viewCount", // 閲覧数でソート
		sortOrder: "desc", // 降順
	});

	const articles = articlesResponse?.data || [];

	if (loading) {
		return (
			<div className="grid gap-8 md:grid-cols-2">
				{Array.from({ length: 10 }).map((_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton doesn't require stable keys
						key={`skeleton-${index}`}
						className="flex flex-row items-start gap-4"
					>
						{/* サムネイル用スケルトン */}
						<div className="w-28 md:w-40 aspect-video bg-muted rounded-md shrink-0 animate-pulse" />

						{/* コンテンツ用スケルトン */}
						<div className="flex-1 flex flex-col gap-2 min-w-0">
							{/* タイトル用スケルトン（3行） */}
							<div className="space-y-2">
								<div className="h-4 bg-muted rounded animate-pulse w-full" />
								<div className="h-4 bg-muted rounded animate-pulse w-full" />
								<div className="h-4 bg-muted rounded animate-pulse w-3/4" />
							</div>

							{/* 抜粋用スケルトン（2行） */}
							<div className="space-y-1">
								<div className="h-3 bg-muted rounded animate-pulse w-full" />
								<div className="h-3 bg-muted rounded animate-pulse w-5/6" />
							</div>

							{/* 更新日時用スケルトン */}
							<div className="h-3 bg-muted rounded animate-pulse w-32" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center p-8 bg-muted rounded-lg">
				<p className="text-destructive mb-4">
					{error instanceof Error
						? error.message
						: "人気記事の読み込みに失敗しました"}
				</p>
				<button
					type="button"
					onClick={() => refetch()}
					className="text-primary hover:text-primary/80 underline"
				>
					再試行
				</button>
			</div>
		);
	}

	if (articles.length === 0) {
		return (
			<div className="text-center p-8 bg-muted rounded-lg">
				<p className="text-muted-foreground">記事がありません</p>
			</div>
		);
	}

	return (
		<div className="grid gap-8 md:grid-cols-2">
			{articles.map((article) => (
				<ArticleCard key={article.id} article={article} />
			))}
		</div>
	);
}
