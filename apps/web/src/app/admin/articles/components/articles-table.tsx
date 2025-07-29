"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { useGetAllArticles } from "../../../../entities/article/api/use-get-all";
import type { Article, ArticleFilters } from "../../../../shared/types/article";
import { ARTICLE_STATUS_CONFIG } from "../../../../shared/types/article";
import { Badge } from "../../../../shared/ui/badge/badge";
import {
	DataTable,
	type DataTableColumn,
	type DataTablePagination,
	type DataTableSort,
} from "../../../../shared/ui/data-table/data-table";
import { ArticleActions } from "./article-actions";
import { ArticlesFilter } from "./articles-filter";

/**
 * 記事一覧テーブルコンポーネントのプロパティ
 */
interface ArticlesTableProps {
	/** テーブル再読み込み用のコールバック */
	onRefresh?: () => void;
}

/**
 * 記事一覧テーブルコンポーネント
 */
export function ArticlesTable({ onRefresh }: ArticlesTableProps) {
	// URLクエリパラメータの管理
	const [urlQuery, setUrlQuery] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		limit: parseAsInteger.withDefault(50),
		status: parseAsString.withDefault("all"),
		search: parseAsString.withDefault(""),
	});

	const [sort, setSort] = useState<DataTableSort>({
		key: "createdAt",
		direction: "desc",
	});
	const [filters, setFilters] = useState<ArticleFilters>({
		status: urlQuery.status as ArticleFilters["status"],
		language: "ja", // 常に日本語固定
		search: urlQuery.search,
	});

	/**
	 * 記事一覧を取得
	 */
	const { data, isLoading, error, refetch } = useGetAllArticles({
		page: urlQuery.page,
		limit: urlQuery.limit,
		language: "ja",
		status: filters.status === "all" ? undefined : (filters.status as any),
		search: filters.search.trim() || undefined,
		sortBy: sort.key as any,
		sortOrder: sort.direction,
	});

	const articles = data?.data || [];
	const pagination: DataTablePagination = {
		page: data?.pagination.page || urlQuery.page,
		limit: data?.pagination.limit || urlQuery.limit,
		total: data?.pagination.total || 0,
		totalPages: data?.pagination.totalPages || 0,
	};

	/**
	 * ページ変更時の処理
	 */
	const handlePageChange = (page: number) => {
		setUrlQuery({ page });
	};

	/**
	 * ページサイズ変更時の処理
	 */
	const handlePageSizeChange = (limit: number) => {
		setUrlQuery({ limit, page: 1 });
	};

	/**
	 * ソート変更時の処理
	 */
	const handleSortChange = (newSort: DataTableSort) => {
		setSort(newSort);
		// ソートが変更されたら1ページ目に戻る
		setUrlQuery({ page: 1 });
	};

	/**
	 * フィルター変更時の処理
	 */
	const handleFiltersChange = (newFilters: ArticleFilters) => {
		setFilters(newFilters);
		// フィルター変更時は1ページ目に戻る
		setUrlQuery({
			status: newFilters.status,
			search: newFilters.search,
			page: 1,
		});
	};

	/**
	 * 記事アクション実行後の処理
	 */
	const handleArticleAction = () => {
		refetch();
		onRefresh?.();
	};

	/**
	 * 日付フォーマット関数
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
	 * テーブルカラムの定義
	 */
	const columns: DataTableColumn<Article>[] = [
		{
			key: "image",
			label: "画像",
			className: "w-[80px]",
			render: (article) => (
				<div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
					{article.cfImageId ? (
						<div
							className="h-full w-full bg-cover bg-center"
							style={{
								backgroundImage: `url(https://imagedelivery.net/placeholder/${article.cfImageId}/public)`,
							}}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
							NoImage
						</div>
					)}
				</div>
			),
		},
		{
			key: "title",
			label: "タイトル",
			sortable: true,
			className: "min-w-[200px]",
			render: (article) => (
				<div className="space-y-1">
					<div className="font-medium">{article.title || "タイトルなし"}</div>
					<div className="text-sm text-muted-foreground">
						スラッグ: {article.slug}
					</div>
				</div>
			),
		},
		{
			key: "tags",
			label: "タグ",
			className: "w-[200px]",
			render: (_article) => (
				// タグ情報は現在のAPIレスポンスに含まれていないため、一時的に空にする
				<div className="text-sm text-muted-foreground">-</div>
			),
		},
		{
			key: "status",
			label: "ステータス",
			sortable: true,
			className: "w-[120px]",
			render: (article) => {
				const config = ARTICLE_STATUS_CONFIG[article.status];
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
		},
		{
			key: "viewCount",
			label: "閲覧数",
			sortable: true,
			className: "w-[100px]",
			render: (article) => (
				<div className="text-sm font-medium text-right">
					{article.viewCount.toLocaleString()}
				</div>
			),
		},
		{
			key: "updatedAt",
			label: "最終更新日",
			sortable: true,
			className: "w-[180px]",
			render: (article) => (
				<div className="text-sm">
					{formatDate(article.updatedAt || article.publishedAt)}
				</div>
			),
		},
		{
			key: "actions",
			label: "アクション",
			className: "w-[120px]",
			render: (article) => (
				<ArticleActions article={article} onAction={handleArticleAction} />
			),
		},
	];

	return (
		<div className="space-y-4">
			{/* フィルター */}
			<ArticlesFilter
				filters={filters}
				onFiltersChange={handleFiltersChange}
				loading={isLoading}
			/>

			{/* データテーブル */}
			<DataTable
				data={articles}
				columns={columns}
				pagination={pagination}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
				pageSizeOptions={[50, 100, 150]}
				sort={sort}
				onSortChange={handleSortChange}
				loading={isLoading}
				error={
					error
						? error instanceof Error
							? error.message
							: "エラーが発生しました"
						: null
				}
				emptyMessage="記事が見つかりません"
			/>
		</div>
	);
}
