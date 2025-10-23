"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

import { ARTICLE_STATUS_CONFIG, type Article } from "@/shared/model";
import { Badge, Button } from "@/shared/ui";

import { ArticleActions } from "../ui/article-actions";

/**
 * 記事ステータスフィルター用のオプション定義
 */
export const articleStatusOptions = [
	{
		label: "公開済み",
		value: "published",
		variant: "success" as const,
	},
	{
		label: "下書き",
		value: "draft",
		variant: "secondary" as const,
	},
	{
		label: "アーカイブ",
		value: "archived",
		variant: "destructive" as const,
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
 * - タグ: 記事のタグ
 * - ステータス: 公開/下書き/アーカイブ
 * - 閲覧数: 記事の閲覧数
 * - 公開日: 公開日時（未公開の場合は「未公開」を表示）
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
				className="font-medium"
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
						className="font-medium hover:text-primary hover:underline transition-colors inline-block"
					>
						{article.title || "タイトルなし"}
					</Link>
					<div className="text-sm text-muted-foreground">{article.slug}</div>
				</div>
			);
		},
		enableSorting: true,
	},
	{
		id: "tags",
		header: "タグ",
		cell: ({ row }) => {
			const article = row.original;
			return (
				<div className="flex flex-wrap gap-1 w-[200px]">
					{article.tags.length > 0 ? (
						article.tags.map((tag) => (
							<Badge key={tag.id} variant="outline" className="text-xs">
								{tag.translations.ja}
							</Badge>
						))
					) : (
						<span className="text-sm text-muted-foreground">-</span>
					)}
				</div>
			);
		},
		enableSorting: false,
	},
	{
		accessorKey: "status",
		header: "ステータス",
		cell: ({ row }) => {
			const article = row.original;
			const config = ARTICLE_STATUS_CONFIG[article.status];
			return (
				<div className="flex justify-center w-[120px]">
					<Badge variant={config.variant}>{config.label}</Badge>
				</div>
			);
		},
		enableSorting: false,
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
				className="font-medium"
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
		accessorKey: "publishedAt",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="font-medium"
			>
				公開日
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const article = row.original;
			return (
				<div className="text-sm w-[180px]">
					{article.publishedAt ? formatDate(article.publishedAt) : "未公開"}
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
				className="font-medium"
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
