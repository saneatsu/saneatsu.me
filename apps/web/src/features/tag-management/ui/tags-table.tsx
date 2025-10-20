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
import { Plus } from "lucide-react";
import Link from "next/link";
import { parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs";
import { useMemo, useState } from "react";

import { useGetAllTags } from "@/entities/tag";
import { usePersistentQueryStates } from "@/shared/lib";
import { Button, DataTable, DataTableSkeleton, Input } from "@/shared/ui";

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
	/**
	 * nuqsを使った永続的な状態管理
	 * - URLパラメータとlocalStorageに保存される
	 */
	const [params, setParams] = usePersistentQueryStates(
		"tags-table-filters",
		{
			search: parseAsString.withDefault(""),
			sortBy: parseAsString.withDefault("updatedAt"),
			sortOrder: parseAsStringEnum(["asc", "desc"] as const).withDefault(
				"desc"
			),
			page: parseAsInteger.withDefault(0), // TanStack Tableは0ベース
			pageSize: parseAsInteger.withDefault(10),
		},
		{
			scroll: false,
			history: "push",
		}
	);

	/**
	 * TanStack Table用のローカル状態
	 * - テーブルの表示状態のみ（永続化不要）
	 */
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	/**
	 * nuqsのパラメータからTanStack Tableのsorting状態を生成
	 */
	const sorting: SortingState = useMemo(
		() => [
			{
				id: params.sortBy,
				desc: params.sortOrder === "desc",
			},
		],
		[params.sortBy, params.sortOrder]
	);

	/**
	 * sortingの変更をnuqsに反映
	 */
	const setSorting = (
		updater: SortingState | ((old: SortingState) => SortingState)
	) => {
		const newSorting =
			typeof updater === "function" ? updater(sorting) : updater;
		if (newSorting[0]) {
			setParams({
				sortBy: newSorting[0].id,
				sortOrder: newSorting[0].desc ? "desc" : "asc",
			});
		}
	};

	/**
	 * nuqsのパラメータからTanStack TableのcolumnFilters状態を生成
	 */
	const columnFilters: ColumnFiltersState = useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (params.search) {
			filters.push({ id: "name", value: params.search });
		}
		return filters;
	}, [params.search]);

	/**
	 * columnFiltersの変更をnuqsに反映
	 */
	const setColumnFilters = (
		updater:
			| ColumnFiltersState
			| ((old: ColumnFiltersState) => ColumnFiltersState)
	) => {
		const newFilters =
			typeof updater === "function" ? updater(columnFilters) : updater;
		const searchFilter = newFilters.find((f) => f.id === "name");

		setParams({
			search: searchFilter ? (searchFilter.value as string) : "",
		});
	};

	/**
	 * タグ一覧を取得
	 */
	const { data, isLoading, error } = useGetAllTags();

	const tags = data?.data || [];

	/**
	 * テーブルインスタンスを作成（クライアントサイドページネーション）
	 */
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
		onPaginationChange: (updater) => {
			const newPagination =
				typeof updater === "function"
					? updater({ pageIndex: params.page, pageSize: params.pageSize })
					: updater;
			setParams({
				page: newPagination.pageIndex,
				pageSize: newPagination.pageSize,
			});
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination: {
				pageIndex: params.page,
				pageSize: params.pageSize,
			},
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
			<div className="flex items-center justify-between gap-2 py-4">
				<Input
					placeholder="タグ名で検索..."
					value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						table.getColumn("name")?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
				<Button asChild>
					<Link href="/admin/tags/new">
						<Plus className="mr-2 h-4 w-4" />
						タグを作成
					</Link>
				</Button>
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
