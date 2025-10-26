"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";

import { ArticleCard, useGetAllArticles } from "@/entities/article";
import { Button } from "@/shared/ui";

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
	const t = useTranslations("pagination");
	const tList = useTranslations("articlesList");
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

	const {
		data: articlesResponse,
		isLoading: loading,
		error,
		refetch,
	} = useGetAllArticles({
		page: limit ? 1 : page, // limitが指定されている場合は常に1ページ目
		language: locale as "ja" | "en",
		limit: limit || 24,
		status: ["published"],
		sortBy: "updatedAt",
		sortOrder: "desc",
	});

	const articles = articlesResponse?.data || [];

	if (loading) {
		return (
			<div className="grid gap-8 md:grid-cols-2">
				{Array.from({ length: limit || 6 }).map((_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton doesn't require stable keys
						key={`skeleton-${index}`}
						className="flex flex-row items-start gap-4"
					>
						{/* サムネイル用スケルトン */}
						<div className="w-28 md:w-40 aspect-video bg-muted rounded-md flex-shrink-0 animate-pulse" />

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
					{error instanceof Error ? error.message : tList("loadFailed")}
				</p>
				<button
					type="button"
					onClick={() => refetch()}
					className="text-primary hover:text-primary/80 underline"
				>
					{tList("retry")}
				</button>
			</div>
		);
	}

	if (articles.length === 0) {
		return (
			<div className="text-center p-8 bg-muted rounded-lg">
				<p className="text-muted-foreground">{tList("empty")}</p>
			</div>
		);
	}

	const pagination = articlesResponse?.pagination;
	const hasPrevPage = pagination && pagination.page > 1;
	const hasNextPage = pagination && pagination.page < pagination.totalPages;

	const handlePrevPage = () => {
		if (hasPrevPage) {
			setPage(page - 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const handleNextPage = () => {
		if (hasNextPage) {
			setPage(page + 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid gap-8 md:grid-cols-2">
				{articles.map((article) => (
					<ArticleCard key={article.id} article={article} />
				))}
			</div>

			{/* トップページなど（limitが指定されている場合）は「すべての記事を見る」リンクを表示 */}
			{limit && articles.length >= limit && (
				<div className="text-center mt-8">
					<a
						href="/blog"
						className="text-primary hover:text-primary/80 underline font-medium inline-flex items-center gap-1"
					>
						{t("viewAllArticles")}
						<ChevronRight className="h-4 w-4" />
					</a>
				</div>
			)}

			{/* /blogページ（limitが指定されていない場合）はページネーションを表示 */}
			{!limit && pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-4 mt-8">
					<Button
						variant="outline"
						onClick={handlePrevPage}
						disabled={!hasPrevPage}
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						{t("previous")}
					</Button>
					<span className="text-sm text-muted-foreground">
						{t("pageIndicator", {
							page: pagination.page,
							totalPages: pagination.totalPages,
						})}
					</span>
					<Button
						variant="outline"
						onClick={handleNextPage}
						disabled={!hasNextPage}
					>
						{t("next")}
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			)}
		</div>
	);
}
