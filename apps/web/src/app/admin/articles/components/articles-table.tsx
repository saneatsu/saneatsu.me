"use client";

import type {
	ColumnFiltersState,
	SortingState,
	VisibilityState,
} from "@tanstack/react-table";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import {
	articleStatusOptions,
	columns,
} from "@/app/admin/articles/model/columns";
import { useGetAllArticles } from "@/entities/article/api/use-get-all";
import type { ArticleFilters } from "@/shared/model/article";
import { DataTableFacetedFilter } from "@/shared/ui/data-table/data-table-faceted-filter";
import { DataTableSkeleton } from "@/shared/ui/data-table/data-table-skeleton";
import { DataTable } from "@/shared/ui/data-table/data-table-tanstack";
import { Input } from "@/shared/ui/input/input";

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

	const [filters, _setFilters] = useState<ArticleFilters>({
		status: "all",
		language: "ja",
		search: "",
	});

	/**
	 * 記事一覧を取得
	 */
	const { data, isLoading, error, refetch } = useGetAllArticles({
		page: 1,
		limit: 100,
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
	 * 記事アクション実行後の処理
	 */
	const handleArticleAction = () => {
		refetch();
		onRefresh?.();
	};

	// テーブルインスタンスを作成
	const table = useReactTable({
		data: articles,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
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
						options={articleStatusOptions}
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
				<DataTable table={table} emptyMessage="記事が見つかりません" />
			)}
		</div>
	);
}
