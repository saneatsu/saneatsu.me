"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui";

/**
 * DataTableSkeletonのプロパティ
 */
interface DataTableSkeletonProps {
	/** カラム数 */
	columnCount: number;
	/** 表示する行数 */
	rowCount?: number;
	/** セルの幅配列（オプショナル） */
	cellWidths?: string[];
	/** ページネーションを表示するか */
	withPagination?: boolean;
}

/**
 * DataTableのスケルトンローディングコンポーネント
 *
 * @description
 * データテーブルのローディング状態を表示するスケルトンコンポーネント。
 * Nitoプロジェクトのパターンに従った実装。
 *
 * @example
 * ```tsx
 * <DataTableSkeleton
 *   columnCount={5}
 *   rowCount={10}
 *   cellWidths={["10rem", "20rem", "10rem", "8rem", "8rem"]}
 *   withPagination
 * />
 * ```
 */
export function DataTableSkeleton({
	columnCount,
	rowCount = 10,
	cellWidths = [],
	withPagination = false,
}: DataTableSkeletonProps) {
	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{Array.from({ length: columnCount }).map((_, index) => (
								<TableHead
									key={`header-${
										// biome-ignore lint/suspicious/noArrayIndexKey: スケルトンのため固定長配列でindexは問題ない
										index
									}`}
									style={cellWidths[index] ? { width: cellWidths[index] } : {}}
								>
									<div className="h-4 w-full bg-muted animate-pulse rounded" />
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: rowCount }).map((_, rowIndex) => (
							<TableRow
								key={`row-${
									// biome-ignore lint/suspicious/noArrayIndexKey: スケルトンのため固定長配列でindexは問題ない
									rowIndex
								}`}
							>
								{Array.from({ length: columnCount }).map((_, cellIndex) => (
									<TableCell
										key={`cell-${
											// biome-ignore lint/suspicious/noArrayIndexKey: スケルトンのため固定長配列でindexは問題ない
											cellIndex
										}`}
										style={
											cellWidths[cellIndex]
												? { width: cellWidths[cellIndex] }
												: {}
										}
									>
										<div className="h-4 w-full bg-muted animate-pulse rounded" />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{withPagination && (
				<div className="flex items-center justify-between px-2">
					<div className="flex items-center space-x-6">
						<div className="h-4 w-32 bg-muted animate-pulse rounded" />
						<div className="h-8 w-20 bg-muted animate-pulse rounded" />
					</div>
					<div className="flex items-center space-x-2">
						<div className="h-8 w-20 bg-muted animate-pulse rounded" />
						<div className="h-4 w-24 bg-muted animate-pulse rounded" />
						<div className="h-8 w-20 bg-muted animate-pulse rounded" />
					</div>
				</div>
			)}
		</div>
	);
}
