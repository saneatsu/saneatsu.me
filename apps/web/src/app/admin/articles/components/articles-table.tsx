"use client";

import { useCallback, useEffect, useState } from "react";
import {
	fetchAllArticles,
	getErrorMessage,
} from "../../../../shared/lib/api-client";
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
	const [articles, setArticles] = useState<Article[]>([]);
	const [pagination, setPagination] = useState<DataTablePagination>({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0,
	});
	const [sort, setSort] = useState<DataTableSort>({
		key: "createdAt",
		direction: "desc",
	});
	const [filters, setFilters] = useState<ArticleFilters>({
		status: "all",
		language: "all",
		search: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 記事一覧を取得
	 */
	const loadArticles = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetchAllArticles({
				page: pagination.page.toString(),
				limit: pagination.limit.toString(),
				lang: filters.language === "all" ? undefined : filters.language,
				status: filters.status === "all" ? undefined : filters.status,
				search: filters.search.trim() || undefined,
			});

			setArticles(response.data);
			setPagination(response.pagination);
		} catch (err) {
			setError(getErrorMessage(err));
			console.error("Failed to load articles:", err);
		} finally {
			setLoading(false);
		}
	}, [
		pagination.page,
		pagination.limit,
		filters.language,
		filters.status,
		filters.search,
	]);

	/**
	 * ページ変更時の処理
	 */
	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }));
	};

	/**
	 * ソート変更時の処理
	 */
	const handleSortChange = (newSort: DataTableSort) => {
		setSort(newSort);
		// 実際の実装では、ソートに応じてAPIパラメータを変更する必要がある
		// 今回は簡略化してクライアントサイドソートは行わない
	};

	/**
	 * フィルター変更時の処理
	 */
	const handleFiltersChange = (newFilters: ArticleFilters) => {
		setFilters(newFilters);
		// フィルター変更時は1ページ目に戻る
		setPagination((prev) => ({ ...prev, page: 1 }));
	};

	/**
	 * 記事アクション実行後の処理
	 */
	const handleArticleAction = () => {
		loadArticles();
		onRefresh?.();
	};

	// 初期読み込み
	useEffect(() => {
		loadArticles();
	}, [loadArticles]);

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
			key: "language",
			label: "言語",
			className: "w-[100px]",
			render: (_article) => {
				// 記事の言語は article_translations から取得する必要があるが、
				// 現在のAPIレスポンスには含まれていないため、仮で表示
				return <Badge variant="outline">日本語</Badge>;
			},
		},
		{
			key: "publishedAt",
			label: "公開日時",
			sortable: true,
			className: "w-[180px]",
			render: (article) => (
				<div className="text-sm">{formatDate(article.publishedAt)}</div>
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
				loading={loading}
			/>

			{/* データテーブル */}
			<DataTable
				data={articles}
				columns={columns}
				pagination={pagination}
				onPageChange={handlePageChange}
				sort={sort}
				onSortChange={handleSortChange}
				loading={loading}
				error={error}
				emptyMessage="記事が見つかりません"
			/>
		</div>
	);
}
