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
import {
	createParser,
	parseAsInteger,
	parseAsString,
	parseAsStringEnum,
} from "nuqs";
import { useMemo, useState } from "react";

import { useGetGalleryImages } from "@/entities/gallery";
import { usePersistentQueryStates } from "@/shared/lib";
import {
	DataTable,
	DataTableFacetedFilter,
	DataTableSkeleton,
	Input,
} from "@/shared/ui";

import { columns } from "../../model/columns";

/**
 * カンマ区切り文字列をboolean配列として扱うカスタムパーサー（位置情報フィルター用）
 */
const parseAsCommaSeparatedBooleans = createParser({
	parse(queryValue) {
		return queryValue
			.split(",")
			.filter(Boolean)
			.map((value) => value === "true");
	},
	serialize(value) {
		return value.map((v) => String(v)).join(",");
	},
}).withDefault([]);

/**
 * ギャラリーテーブルコンポーネントのプロパティ
 */
interface GalleryTableProps {
	/** テーブル再読み込み用のコールバック */
	onRefresh?: () => void;
}

/**
 * 位置情報フィルター用のオプション定義
 */
const locationFilterOptions = [
	{
		label: "位置情報あり",
		value: "true",
	},
	{
		label: "位置情報なし",
		value: "false",
	},
];

/**
 * ギャラリーテーブルコンポーネント
 *
 * @description
 * @tanstack/react-tableを使用したギャラリー画像一覧テーブル。
 *
 * 機能:
 * - ソート（タイトル、撮影日時、更新日時）
 * - フィルタリング（位置情報、検索）
 * - ページネーション
 * - ローディング状態表示
 */
export function GalleryTable({ onRefresh }: GalleryTableProps) {
	/**
	 * nuqsを使った永続的な状態管理
	 * - URLパラメータとlocalStorageに保存される
	 */
	const [params, setParams] = usePersistentQueryStates(
		"gallery-table-filters",
		{
			page: parseAsInteger.withDefault(1),
			pageSize: parseAsInteger.withDefault(50),
			hasLocation: parseAsCommaSeparatedBooleans,
			search: parseAsString.withDefault(""),
			sortBy: parseAsStringEnum(["takenAt", "updatedAt"] as const).withDefault(
				"updatedAt"
			),
			sortOrder: parseAsStringEnum(["asc", "desc"] as const).withDefault(
				"desc"
			),
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
				sortBy: newSorting[0].id as "takenAt" | "updatedAt",
				sortOrder: newSorting[0].desc ? "desc" : "asc",
			});
		}
	};

	/**
	 * nuqsのパラメータからTanStack TableのcolumnFilters状態を生成
	 */
	const columnFilters: ColumnFiltersState = useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (params.hasLocation.length > 0) {
			filters.push({ id: "hasLocation", value: params.hasLocation });
		}
		if (params.search) {
			filters.push({ id: "title", value: params.search });
		}
		return filters;
	}, [params.hasLocation, params.search]);

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
		const locationFilter = newFilters.find((f) => f.id === "hasLocation");
		const searchFilter = newFilters.find((f) => f.id === "title");

		setParams({
			hasLocation: locationFilter ? (locationFilter.value as boolean[]) : [],
			search: searchFilter ? (searchFilter.value as string) : "",
		});
	};

	/**
	 * ギャラリー画像一覧を取得（サーバーサイドページネーション）
	 */
	const { data, isLoading, error, refetch } = useGetGalleryImages({
		page: params.page,
		limit: params.pageSize,
		hasLocation:
			params.hasLocation.length === 1 ? params.hasLocation[0] : undefined,
		sortBy: params.sortBy,
		sortOrder: params.sortOrder,
	});

	const images = data?.images || [];

	// サーバーサイドページネーション用の総ページ数を計算
	const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

	/**
	 * 画像アクション実行後の処理
	 */
	const handleImageAction = () => {
		refetch();
		onRefresh?.();
	};

	/**
	 * テーブルインスタンスを作成（サーバーサイドページネーション対応）
	 */
	const table = useReactTable({
		data: images,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		// サーバーサイドページネーション設定
		manualPagination: true,
		pageCount: totalPages,
		onPaginationChange: (updater) => {
			const newPagination =
				typeof updater === "function"
					? updater({ pageIndex: params.page - 1, pageSize: params.pageSize })
					: updater;
			setParams({
				page: newPagination.pageIndex + 1,
				pageSize: newPagination.pageSize,
			});
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination: {
				pageIndex: params.page - 1, // TanStack Tableは0ベース、APIは1ベース
				pageSize: params.pageSize,
			},
		},
		meta: {
			onAction: handleImageAction,
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
				{table.getColumn("hasLocation") && (
					<DataTableFacetedFilter
						column={table.getColumn("hasLocation")}
						title="位置情報"
						options={locationFilterOptions}
						multiple={true}
					/>
				)}
			</div>

			{/* データテーブル */}
			{isLoading ? (
				<DataTableSkeleton
					columnCount={columns.length}
					rowCount={50}
					cellWidths={["80px", "200px", "120px", "150px", "150px", "120px"]}
					withPagination
				/>
			) : (
				<DataTable
					table={table}
					emptyMessage="画像が見つかりません"
					pagination={
						data
							? {
									total: data.total,
									totalPages,
								}
							: undefined
					}
				/>
			)}
		</div>
	);
}
