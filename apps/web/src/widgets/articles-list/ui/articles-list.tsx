"use client";

import { useLocale } from "next-intl";
import { useGetAllArticles } from "../../../entities/article/api/use-get-all";
import { ArticleCard } from "../../../entities/article/ui/article-card";

interface ArticlesListProps {
	/** 表示する記事の数（省略時は全て表示） */
	limit?: number;
}

/**
 * 記事一覧ウィジェット
 *
 * @description
 * 公開済みの記事をカード形式で一覧表示するウィジェット。
 * ページネーション、多言語対応をサポート。
 */
export function ArticlesList({ limit }: ArticlesListProps) {
	const locale = useLocale();

	const {
		data: articlesResponse,
		isLoading: loading,
		error,
		refetch,
	} = useGetAllArticles({
		language: locale as "ja" | "en",
		limit: limit || 10,
		status: "published",
		sortBy: "updatedAt",
		sortOrder: "desc",
	});

	const articles = articlesResponse?.data || [];

	if (loading) {
		return (
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: limit || 6 }).map((_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton doesn't require stable keys
						key={`skeleton-${index}`}
						className="h-64 bg-muted rounded-lg animate-pulse"
					/>
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
						: "記事の読み込みに失敗しました。"}
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
				<p className="text-muted-foreground">記事が見つかりませんでした。</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{articles.map((article) => (
					<ArticleCard key={article.id} article={article} />
				))}
			</div>

			{limit && articles.length >= limit && (
				<div className="text-center mt-8">
					<a
						href="/articles"
						className="text-primary hover:text-primary/80 underline font-medium"
					>
						すべての記事を見る →
					</a>
				</div>
			)}
		</div>
	);
}
