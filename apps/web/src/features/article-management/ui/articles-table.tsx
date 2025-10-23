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

import { useGetAllArticles } from "@/entities/article";
import { useDashboardOverview } from "@/features/dashboard";
import { usePersistentQueryStates } from "@/shared/lib";
import {
	DataTable,
	DataTableFacetedFilter,
	DataTableSkeleton,
	Input,
} from "@/shared/ui";

import { articleStatusOptions, columns } from "../model/columns";

/**
 * カンマ区切り文字列を配列として扱うカスタムパーサー
 */
const parseAsCommaSeparatedArray = createParser({
	parse(queryValue) {
		return queryValue.split(",").filter(Boolean) as (
			| "published"
			| "draft"
			| "archived"
		)[];
	},
	serialize(value) {
		return value.join(",");
	},
}).withDefault([]);

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
	/**
	 * nuqsを使った永続的な状態管理
	 * - URLパラメータとlocalStorageに保存される
	 */
	const [params, setParams] = usePersistentQueryStates(
		"articles-table-filters",
		{
			page: parseAsInteger.withDefault(1),
			pageSize: parseAsInteger.withDefault(50),
			status: parseAsCommaSeparatedArray,
			search: parseAsString.withDefault(""),
			sortBy: parseAsString.withDefault("updatedAt"),
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
		if (params.status.length > 0) {
			filters.push({ id: "status", value: params.status });
		}
		if (params.search) {
			filters.push({ id: "title", value: params.search });
		}
		return filters;
	}, [params.status, params.search]);

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
		const statusFilter = newFilters.find((f) => f.id === "status");
		const searchFilter = newFilters.find((f) => f.id === "title");

		setParams({
			status: statusFilter
				? (statusFilter.value as ("published" | "draft" | "archived")[])
				: [],
			search: searchFilter ? (searchFilter.value as string) : "",
		});
	};

	/**
	 * ダッシュボード統計を取得（ステータスフィルターの件数表示用）
	 */
	const { data: dashboardData } = useDashboardOverview({ language: "ja" });

	/**
	 * 記事一覧を取得（サーバーサイドページネーション）
	 */
	const { data, isLoading, error, refetch } = useGetAllArticles({
		page: params.page,
		limit: params.pageSize,
		language: "ja",
		status: params.status.length === 0 ? undefined : params.status,
		search: params.search.trim() || undefined,
		sortBy: params.sortBy as
			| "createdAt"
			| "updatedAt"
			| "publishedAt"
			| "title"
			| "viewCount"
			| undefined,
		sortOrder: params.sortOrder,
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

	/**
	 * テーブルインスタンスを作成（サーバーサイドページネーション対応）
	 */
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
					rowCount={50}
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
