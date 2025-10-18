"use client";

import type {
	ColumnFiltersState,
	SortingState,
	VisibilityState,
} from "@tanstack/react-table";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useGetAllArticles } from "@/entities/article";
import { useDashboardOverview } from "@/features/dashboard";
import type { ArticleFilters } from "@/shared/model";
import {
	DataTable,
	DataTableFacetedFilter,
	DataTableSkeleton,
	Input,
} from "@/shared/ui";

import { articleStatusOptions, columns } from "../model/columns";

/**
 * 記事一覧テーブルコンポーネントのプロパティ
 */
interface ArticlesTableProps {
	/** テーブル再読み込み用のコールバック */
	onRefresh?: () => void;
}

/**
 * 記事一覧テーブルコンポーネント
 *
 * @description
 * @tanstack/react-tableを使用した記事一覧テーブル。
 * Nitoプロジェクトのパターンに従った実装。
 *
 * 機能:
 * - ソート（タイトル、ステータス、閲覧数、更新日）
 * - フィルタリング（ステータス、検索）
 * - ページネーション
 * - ローディング状態表示
 */
export function ArticlesTable({ onRefresh }: ArticlesTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "updatedAt",
			desc: true, // 最新順でデフォルトソート
		},
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	// サーバーサイドページネーション用の状態管理
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [filters, _setFilters] = useState<ArticleFilters>({
		status: "all",
		language: "ja",
		search: "",
	});

	/**
	 * ダッシュボード統計を取得（ステータスフィルターの件数表示用）
	 */
	const { data: dashboardData } = useDashboardOverview({ language: "ja" });

	/**
	 * 記事一覧を取得（サーバーサイドページネーション）
	 */
	const { data, isLoading, error, refetch } = useGetAllArticles({
		page,
		limit: pageSize,
		language: "ja",
		status: filters.status === "all" ? undefined : filters.status,
		search: filters.search.trim() || undefined,
		sortBy: sorting[0]?.id as
			| "createdAt"
			| "updatedAt"
			| "publishedAt"
			| "title"
			| "viewCount"
			| undefined,
		sortOrder: sorting[0]?.desc ? "desc" : "asc",
	});

	const articles = data?.data || [];

	/**
	 * ステータスフィルターオプション（件数付き）
	 *
	 * @description
	 * ダッシュボードAPIから取得した統計データを使用して、
	 * 各ステータスの件数を表示する。
	 */
	const statusOptionsWithCount = useMemo(() => {
		if (!dashboardData?.articleStats) {
			return articleStatusOptions;
		}

		return articleStatusOptions.map((option) => ({
			...option,
			count:
				option.value === "published"
					? dashboardData.articleStats.publishedArticles
					: option.value === "draft"
						? dashboardData.articleStats.draftArticles
						: option.value === "archived"
							? dashboardData.articleStats.archivedArticles
							: undefined,
		}));
	}, [dashboardData]);

	/**
	 * 記事アクション実行後の処理
	 */
	const handleArticleAction = () => {
		refetch();
		onRefresh?.();
	};

	// テーブルインスタンスを作成（サーバーサイドページネーション対応）
	const table = useReactTable({
		data: articles,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		// クライアントサイドページネーションを無効化
		// getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		// サーバーサイドページネーション設定
		manualPagination: true,
		pageCount: data?.pagination?.totalPages ?? 0,
		onPaginationChange: (updater) => {
			const newPagination =
				typeof updater === "function"
					? updater({ pageIndex: page - 1, pageSize })
					: updater;
			setPage(newPagination.pageIndex + 1);
			setPageSize(newPagination.pageSize);
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination: {
				pageIndex: page - 1, // TanStack Tableは0ベース、APIは1ベース
				pageSize,
			},
		},
		meta: {
			onAction: handleArticleAction,
		},
	});

	// エラー状態
	if (error) {
		return (
			<div className="rounded-md border border-destructive bg-destructive/10 p-4">
				<p className="text-sm text-destructive">
					エラー: {(error as Error).message || "エラーが発生しました"}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* フィルター */}
			<div className="flex items-center gap-2 py-4">
				<Input
					placeholder="タイトルで検索..."
					value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						table.getColumn("title")?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
				{table.getColumn("status") && (
					<DataTableFacetedFilter
						column={table.getColumn("status")}
						title="ステータス"
						options={statusOptionsWithCount}
						multiple={true}
					/>
				)}
			</div>

			{/* データテーブル */}
			{isLoading ? (
				<DataTableSkeleton
					columnCount={columns.length}
					rowCount={10}
					cellWidths={[
						"80px",
						"200px",
						"200px",
						"120px",
						"100px",
						"180px",
						"120px",
					]}
					withPagination
				/>
			) : (
				<DataTable
					table={table}
					emptyMessage="記事が見つかりません"
					pagination={
						data?.pagination
							? {
									total: data.pagination.total,
									totalPages: data.pagination.totalPages,
								}
							: undefined
					}
				/>
			)}
		</div>
	);
}
