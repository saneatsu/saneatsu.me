"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { Button } from "../button/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../table/table";

/**
 * テーブルカラムの定義
 */
export interface DataTableColumn<T> {
	/** カラムのユニークキー */
	key: string;
	/** 表示ラベル */
	label: string;
	/** データの表示に使用する関数 */
	render?: (item: T) => React.ReactNode;
	/** ソート可能かどうか */
	sortable?: boolean;
	/** カラムの幅クラス */
	className?: string;
}

/**
 * ページネーション情報
 */
export interface DataTablePagination {
	/** 現在のページ */
	page: number;
	/** 1ページあたりのアイテム数 */
	limit: number;
	/** 総アイテム数 */
	total: number;
	/** 総ページ数 */
	totalPages: number;
}

/**
 * ソート情報
 */
export interface DataTableSort {
	/** ソート対象のカラムキー */
	key: string;
	/** ソート順序 */
	direction: "asc" | "desc";
}

/**
 * DataTable コンポーネントのプロパティ
 */
export interface DataTableProps<T> {
	/** テーブルデータ */
	data: T[];
	/** カラム定義 */
	columns: DataTableColumn<T>[];
	/** ページネーション情報（省略可能） */
	pagination?: DataTablePagination;
	/** ページ変更時のコールバック */
	onPageChange?: (page: number) => void;
	/** ソート情報（省略可能） */
	sort?: DataTableSort;
	/** ソート変更時のコールバック */
	onSortChange?: (sort: DataTableSort) => void;
	/** ローディング状態 */
	loading?: boolean;
	/** エラーメッセージ */
	error?: string | null;
	/** テーブルが空の場合の表示メッセージ */
	emptyMessage?: string;
}

/**
 * 汎用的なデータテーブルコンポーネント
 * ページネーション、ソート、ローディング状態をサポート
 */
export function DataTable<T>({
	data,
	columns,
	pagination,
	onPageChange,
	sort,
	onSortChange,
	loading = false,
	error,
	emptyMessage = "データがありません",
}: DataTableProps<T>) {
	/**
	 * カラムヘッダークリック時のソート処理
	 */
	const handleSort = (columnKey: string) => {
		if (!onSortChange) return;

		const newDirection =
			sort?.key === columnKey && sort.direction === "asc" ? "desc" : "asc";

		onSortChange({
			key: columnKey,
			direction: newDirection,
		});
	};

	/**
	 * ソートインジケーターの取得
	 */
	const getSortIndicator = (columnKey: string) => {
		if (!sort || sort.key !== columnKey) return null;
		return sort.direction === "asc" ? " ↑" : " ↓";
	};

	/**
	 * ページネーションコンポーネント
	 */
	const renderPagination = () => {
		if (!pagination || !onPageChange) return null;

		const { page, totalPages } = pagination;
		const canGoPrevious = page > 1;
		const canGoNext = page < totalPages;

		return (
			<div className="flex items-center justify-between px-2 py-4">
				<div className="text-sm text-muted-foreground">
					{pagination.total > 0 ? (
						<>
							{(page - 1) * pagination.limit + 1}-
							{Math.min(page * pagination.limit, pagination.total)} の{" "}
							{pagination.total} 件
						</>
					) : (
						"0 件"
					)}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(page - 1)}
						disabled={!canGoPrevious}
					>
						<ChevronLeft className="h-4 w-4" />
						前へ
					</Button>
					<div className="text-sm font-medium">
						ページ {page} / {totalPages}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(page + 1)}
						disabled={!canGoNext}
					>
						次へ
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	};

	// エラー状態の表示
	if (error) {
		return (
			<div className="rounded-md border border-destructive bg-destructive/10 p-4">
				<p className="text-sm text-destructive">エラー: {error}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((column) => (
							<TableHead
								key={column.key}
								className={column.className}
								onClick={
									column.sortable ? () => handleSort(column.key) : undefined
								}
								role={column.sortable ? "button" : undefined}
								tabIndex={column.sortable ? 0 : undefined}
								style={{
									cursor: column.sortable ? "pointer" : "default",
								}}
							>
								{column.label}
								{column.sortable && getSortIndicator(column.key)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						// ローディング状態
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								<div className="flex items-center justify-center">
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									<span className="ml-2">読み込み中...</span>
								</div>
							</TableCell>
						</TableRow>
					) : data.length === 0 ? (
						// データが空の場合
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								{emptyMessage}
							</TableCell>
						</TableRow>
					) : (
						// データ表示
						data.map((item, index) => (
							<TableRow key={(item as { id?: string | number }).id || index}>
								{columns.map((column) => (
									<TableCell key={column.key} className={column.className}>
										{column.render
											? column.render(item)
											: String(
													(item as Record<string, unknown>)[column.key] || ""
												)}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			{renderPagination()}
		</div>
	);
}
