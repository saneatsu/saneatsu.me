"use client";

import type { Column } from "@tanstack/react-table";
import { Check, PlusCircle, XCircle } from "lucide-react";
import type * as React from "react";
import { useCallback, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "../command/command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";
import { Separator } from "../separator/separator";

/**
 * フィルターオプションの定義
 */
export interface DataTableFacetedFilterOption {
	/** 表示ラベル */
	label: string;
	/** フィルター値 */
	value: string;
	/** アイコン（オプショナル） */
	icon?: React.ComponentType<{ className?: string }>;
	/** 件数表示（オプショナル） */
	count?: number;
	/** バッジのvariant（オプショナル） */
	variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

/**
 * DataTableFacetedFilterのプロパティ
 */
interface DataTableFacetedFilterProps<TData, TValue> {
	/** フィルター対象のカラム */
	column?: Column<TData, TValue>;
	/** フィルタータイトル */
	title?: string;
	/** フィルターオプションリスト */
	options: DataTableFacetedFilterOption[];
	/** 複数選択を許可するか（デフォルト: true） */
	multiple?: boolean;
}

/**
 * DataTableの複数選択フィルターコンポーネント
 *
 * @description
 * TanStack React Tableのカラムフィルタリング機能を使用した、
 * 複数選択可能なフィルターコンポーネント。
 * Nitoプロジェクトのパターンに従った実装。
 *
 * 機能:
 * - 複数選択/解除
 * - 検索機能
 * - 選択中の項目を表示
 * - すべてクリア
 *
 * @example
 * ```tsx
 * <DataTableFacetedFilter
 *   column={table.getColumn("status")}
 *   title="ステータス"
 *   options={[
 *     { label: "公開済み", value: "published" },
 *     { label: "下書き", value: "draft" },
 *   ]}
 * />
 * ```
 */
export function DataTableFacetedFilter<TData, TValue>({
	column,
	title,
	options,
	multiple = true,
}: DataTableFacetedFilterProps<TData, TValue>) {
	const [open, setOpen] = useState(false);

	const columnFilterValue = column?.getFilterValue();
	const selectedValues = new Set(
		Array.isArray(columnFilterValue) ? columnFilterValue : []
	);

	/**
	 * アイテム選択時のコールバック
	 *
	 * 1. 複数選択モード: 選択状態をトグル
	 * 2. 単一選択モード: 選択してPopoverを閉じる
	 */
	const onItemSelect = useCallback(
		(option: DataTableFacetedFilterOption, isSelected: boolean) => {
			if (!column) return;

			if (multiple) {
				const newSelectedValues = new Set(selectedValues);
				if (isSelected) {
					newSelectedValues.delete(option.value);
				} else {
					newSelectedValues.add(option.value);
				}
				const filterValues = Array.from(newSelectedValues);
				column.setFilterValue(filterValues.length ? filterValues : undefined);
			} else {
				column.setFilterValue(isSelected ? undefined : [option.value]);
				setOpen(false);
			}
		},
		[column, multiple, selectedValues]
	);

	/**
	 * フィルターリセット時のコールバック
	 *
	 * イベント伝播を停止して、親要素のクリックイベントを防ぐ
	 */
	const onReset = useCallback(
		(event?: React.MouseEvent) => {
			event?.stopPropagation();
			column?.setFilterValue(undefined);
		},
		[column]
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="h-9 border-dashed">
					{selectedValues?.size > 0 ? (
						// biome-ignore lint/a11y/useSemanticElements: PopoverTrigger内のカスタムクリアボタンコンポーネント
						<div
							role="button"
							aria-label={`Clear ${title} filter`}
							tabIndex={0}
							onClick={onReset}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onReset();
								}
							}}
							className="mr-2 h-4 w-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<XCircle className="h-4 w-4" />
						</div>
					) : (
						<PlusCircle className="mr-2 h-4 w-4" />
					)}
					{title}
					{selectedValues?.size > 0 && (
						<>
							<Separator orientation="vertical" className="mx-2 h-4" />
							<Badge
								variant="secondary"
								className="rounded-sm px-1 font-normal lg:hidden"
							>
								{selectedValues.size}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedValues.size > 2 ? (
									<Badge
										variant="secondary"
										className="rounded-sm px-1 font-normal"
									>
										{selectedValues.size} 選択中
									</Badge>
								) : (
									options
										.filter((option) => selectedValues.has(option.value))
										.map((option) => (
											<Badge
												variant="secondary"
												key={option.value}
												className="rounded-sm px-1 font-normal"
											>
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandInput placeholder={title} />
					<CommandList>
						<CommandEmpty>結果が見つかりません</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value);
								return (
									<CommandItem
										key={option.value}
										onSelect={() => onItemSelect(option, isSelected)}
										className="cursor-pointer"
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible"
											)}
										>
											<Check className={cn("h-4 w-4")} />
										</div>
										{option.icon && (
											<option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
										)}
										{option.variant ? (
											<Badge variant={option.variant} className="truncate">
												{option.label}
											</Badge>
										) : (
											<span className="truncate">{option.label}</span>
										)}
										{option.count !== undefined && (
											<span className="ml-auto font-mono text-xs">
												{option.count}
											</span>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() => onReset()}
										className="cursor-pointer justify-center text-center"
									>
										クリア
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
