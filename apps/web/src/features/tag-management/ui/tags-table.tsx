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

import { useGetAllTags } from "@/entities/tag";
import { DataTable, DataTableSkeleton, Input } from "@/shared/ui";

import { columns } from "../model/columns";

/**
 * タグ一覧テーブルコンポーネント
 *
 * @description
 * @tanstack/react-tableを使用したタグ一覧テーブル。
 *
 * 機能:
 * - ソート（タグ名、記事数、作成日、更新日）
 * - フィルタリング（タグ名検索）
 * - ページネーション
 * - ローディング状態表示
 */
export function TagsTable() {
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "createdAt",
			desc: false, // 作成日の昇順でデフォルトソート
		},
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	/**
	 * タグ一覧を取得
	 */
	const { data, isLoading, error } = useGetAllTags();

	const tags = data?.data || [];

	// テーブルインスタンスを作成
	const table = useReactTable({
		data: tags,
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
					placeholder="タグ名で検索..."
					value={(table.getColumn("slug")?.getFilterValue() as string) ?? ""}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						table.getColumn("slug")?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
			</div>

			{/* データテーブル */}
			{isLoading ? (
				<DataTableSkeleton
					columnCount={columns.length}
					rowCount={10}
					cellWidths={["200px", "100px", "180px", "180px"]}
					withPagination
				/>
			) : (
				<DataTable table={table} emptyMessage="タグが見つかりません" />
			)}
		</div>
	);
}
