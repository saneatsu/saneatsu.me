"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import type { Tag } from "@/shared/model";
import { Button } from "@/shared/ui";

import { TagActions } from "../ui/tag-actions";

/**
 * 日付フォーマット関数
 *
 * @param dateString - フォーマット対象の日付文字列
 * @returns フォーマットされた日付文字列
 */
function formatDate(dateString: string): string {
	try {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	} catch {
		return "無効な日付";
	}
}

/**
 * タグテーブルのカラム定義
 *
 * @description
 * @tanstack/react-tableのColumnDef型を使用したカラム定義。
 *
 * カラム:
 * - タグ名: タグのスラッグ（日本語名）
 * - 記事数: このタグが付けられた記事の数
 * - 作成日: 作成日時
 * - 更新日: 更新日時
 */
export const columns: ColumnDef<Tag>[] = [
	{
		accessorKey: "slug",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-medium"
			>
				タグ名
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const tag = row.original;
			return (
				<div className="font-medium min-w-[200px]">
					{tag.slug || "タグ名なし"}
				</div>
			);
		},
		enableSorting: true,
	},
	{
		accessorKey: "articleCount",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-medium"
			>
				記事数
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const tag = row.original;
			return (
				<div className="text-sm font-medium text-right w-[100px]">
					{tag.articleCount.toLocaleString()}
				</div>
			);
		},
		enableSorting: true,
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-medium"
			>
				作成日
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const tag = row.original;
			return (
				<div className="text-sm w-[180px]">{formatDate(tag.createdAt)}</div>
			);
		},
		enableSorting: true,
	},
	{
		accessorKey: "updatedAt",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-medium"
			>
				更新日
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const tag = row.original;
			return (
				<div className="text-sm w-[180px]">{formatDate(tag.updatedAt)}</div>
			);
		},
		enableSorting: true,
	},
	{
		id: "actions",
		header: "アクション",
		cell: ({ row }) => {
			const tag = row.original;
			return (
				<div className="w-[120px]">
					<TagActions tag={tag} />
				</div>
			);
		},
		enableSorting: false,
	},
];
