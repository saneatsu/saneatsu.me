"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

import { ArticleActions } from "@/app/admin/articles/components/article-actions";
import type { Article } from "@/shared/model/article";
import { ARTICLE_STATUS_CONFIG } from "@/shared/model/article";
import { Badge } from "@/shared/ui/badge/badge";
import { Button } from "@/shared/ui/button/button";

/**
 * 記事ステータスフィルター用のオプション定義
 */
export const articleStatusOptions = [
	{
		label: "公開済み",
		value: "published",
	},
	{
		label: "下書き",
		value: "draft",
	},
	{
		label: "アーカイブ",
		value: "archived",
	},
];

/**
 * 日付フォーマット関数
 *
 * @param dateString - フォーマット対象の日付文字列
 * @returns フォーマットされた日付文字列
 */
function formatDate(dateString: string | null): string {
	if (!dateString) return "未設定";

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
 * 記事テーブルのカラム定義
 *
 * @description
 * @tanstack/react-tableのColumnDef型を使用したカラム定義。
 * Nitoプロジェクトのパターンに従った実装。
 *
 * カラム:
 * - 画像: サムネイル画像
 * - タイトル: 記事タイトルとスラッグ
 * - タグ: 記事のタグ（未実装）
 * - ステータス: 公開/下書き/アーカイブ
 * - 閲覧数: 記事の閲覧数
 * - 最終更新日: 更新日時
 * - アクション: 編集・削除ボタン
 */
export const columns: ColumnDef<Article>[] = [
	{
		id: "image",
		header: "画像",
		cell: ({ row }) => {
			const article = row.original;
			return (
				<div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
					{article.cfImageId ? (
						<div
							className="h-full w-full bg-cover bg-center"
							style={{
								backgroundImage: `url(https://imagedelivery.net/placeholder/${article.cfImageId}/public)`,
							}}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
							NoImage
						</div>
					)}
				</div>
			);
		},
		enableSorting: false,
	},
	{
		accessorKey: "title",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-medium"
			>
				タイトル
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const article = row.original;
			return (
				<div className="space-y-1 min-w-[200px]">
					<Link
						href={`/admin/articles/${article.id}/edit`}
						className="font-medium hover:text-blue-600 hover:underline transition-colors inline-block"
					>
						{article.title || "タイトルなし"}
					</Link>
					<div className="text-sm text-muted-foreground">
						スラッグ: {article.slug}
					</div>
				</div>
			);
		},
		enableSorting: true,
	},
	{
		id: "tags",
		header: "タグ",
		cell: () => {
			// タグ情報は現在のAPIレスポンスに含まれていないため、一時的に空にする
			return <div className="text-sm text-muted-foreground w-[200px]">-</div>;
		},
		enableSorting: false,
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-medium"
			>
				ステータス
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const article = row.original;
			const config = ARTICLE_STATUS_CONFIG[article.status];
			return (
				<div className="flex justify-center w-[120px]">
					<Badge variant={config.variant}>{config.label}</Badge>
				</div>
			);
		},
		enableSorting: true,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "viewCount",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="h-auto p-0 font-medium"
			>
				閲覧数
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const article = row.original;
			return (
				<div className="text-sm font-medium text-right w-[100px]">
					{article.viewCount?.toLocaleString() ?? "0"}
				</div>
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
				最終更新日
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const article = row.original;
			return (
				<div className="text-sm w-[180px]">
					{formatDate(article.updatedAt || article.publishedAt)}
				</div>
			);
		},
		enableSorting: true,
	},
	{
		id: "actions",
		header: "アクション",
		cell: ({ row, table }) => {
			const article = row.original;
			const meta = table.options.meta as { onAction?: () => void };
			return (
				<div className="w-[120px]">
					<ArticleActions
						article={article}
						onAction={meta?.onAction || (() => {})}
					/>
				</div>
			);
		},
		enableSorting: false,
	},
];
