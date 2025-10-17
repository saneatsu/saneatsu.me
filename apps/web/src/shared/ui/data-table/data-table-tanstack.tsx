"use client";

import type { Table as ReactTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table/table";

/**
 * DataTableコンポーネントのプロパティ
 *
 * @description
 * @tanstack/react-tableを使用したデータテーブルコンポーネント。
 * Nitoプロジェクトのパターンに従った実装。
 */
interface DataTableProps<TData> {
	/**
	 * React Tableのインスタンス
	 */
	table: ReactTable<TData>;
	/**
	 * 行クリック時のハンドラー
	 */
	onRowClick?: (row: TData) => void;
	/**
	 * テーブルが空の場合の表示メッセージ
	 */
	emptyMessage?: string;
}

/**
 * TanStack React Table対応のDataTableコンポーネント
 *
 * @description
 * @tanstack/react-tableのTableインスタンスを受け取り、
 * データテーブルとページネーションをレンダリングする。
 *
 * 機能:
 * - ソート機能（カラム定義による）
 * - ページネーション
 * - カラムフィルタリング
 * - 行選択
 * - カスタマイズ可能な行クリックハンドラー
 *
 * @example
 * ```tsx
 * const table = useReactTable({
 *   data: articles,
 *   columns,
 *   getCoreRowModel: getCoreRowModel(),
 *   getPaginationRowModel: getPaginationRowModel(),
 * });
 *
 * <DataTable table={table} onRowClick={(article) => console.log(article)} />
 * ```
 */
export function DataTable<TData>({
	table,
	onRowClick,
	emptyMessage = "データがありません",
}: DataTableProps<TData>) {
	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									onClick={() => onRowClick?.(row.original)}
									className={onRowClick ? "cursor-pointer" : undefined}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={table.getAllColumns().length}
									className="h-24 text-center"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* ページネーション */}
			<div className="flex items-center justify-between px-2">
				<div className="flex items-center space-x-6 text-sm text-muted-foreground">
					<div>
						{table.getFilteredRowModel().rows.length > 0 ? (
							<>
								{table.getState().pagination.pageIndex *
									table.getState().pagination.pageSize +
									1}
								-
								{Math.min(
									(table.getState().pagination.pageIndex + 1) *
										table.getState().pagination.pageSize,
									table.getFilteredRowModel().rows.length
								)}{" "}
								の {table.getFilteredRowModel().rows.length} 件
							</>
						) : (
							"0 件"
						)}
					</div>
					<div className="flex items-center space-x-2">
						<span className="text-sm">表示件数:</span>
						<Select
							value={`${table.getState().pagination.pageSize}`}
							onValueChange={(value) => {
								table.setPageSize(Number(value));
							}}
						>
							<SelectTrigger className="h-8 w-[70px]">
								<SelectValue
									placeholder={table.getState().pagination.pageSize}
								/>
							</SelectTrigger>
							<SelectContent side="top">
								{[10, 20, 50, 100].map((pageSize) => (
									<SelectItem key={pageSize} value={`${pageSize}`}>
										{pageSize}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronLeft className="h-4 w-4" />
						前へ
					</Button>
					<div className="text-sm font-medium">
						ページ {table.getState().pagination.pageIndex + 1} /{" "}
						{table.getPageCount()}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						次へ
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
