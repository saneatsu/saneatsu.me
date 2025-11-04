"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MapPin } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";

import type { GalleryImage } from "@/entities/gallery";
import { formatRelativeDate, getImageUrl } from "@/shared/lib";
import { Badge, Button } from "@/shared/ui";

import { GalleryActions } from "../ui/gallery-actions/gallery-actions";

/**
 * 相対日付表示コンポーネント
 *
 * @param dateString - ISO 8601形式の日付文字列
 * @returns 相対日付（x分前、x時間前、x日前）または絶対日付
 */
function DateCell({ dateString }: { dateString: string | null }) {
	const locale = useLocale();

	if (!dateString) return <span className="text-muted-foreground">未設定</span>;

	const dateInfo = formatRelativeDate(dateString, locale as "ja" | "en");

	if (!dateInfo)
		return <span className="text-muted-foreground">無効な日付</span>;

	if (dateInfo.isRelative) {
		// 相対表示
		if (dateInfo.minutes !== undefined) {
			// 1時間未満
			return dateInfo.minutes === 0 ? "たった今" : `${dateInfo.minutes}分前`;
		}
		if (dateInfo.hours !== undefined) {
			// 24時間未満
			return `${dateInfo.hours}時間前`;
		}
		if (dateInfo.days !== undefined) {
			// 10日以内
			return dateInfo.days === 0 ? "今日" : `${dateInfo.days}日前`;
		}
	}

	// 絶対日付表示
	return <>{dateInfo.formatted}</>;
}

/**
 * ギャラリーテーブルのカラム定義
 *
 * @description
 * @tanstack/react-tableのColumnDef型を使用したカラム定義。
 *
 * カラム:
 * - 画像: サムネイル画像（Cloudflare Images small variant）
 * - タイトル: 画像タイトル（日本語）
 * - 位置情報: 緯度・経度の有無
 * - 撮影日時: 撮影日時（未設定の場合は「未設定」を表示）
 * - 更新日時: 更新日時
 * - アクション: 編集・削除ボタン
 */
export const columns: ColumnDef<GalleryImage>[] = [
	{
		id: "image",
		header: "画像",
		cell: ({ row }) => {
			const image = row.original;
			const imageUrl = getImageUrl(image.cfImageId, "small");

			return (
				<div className="flex items-center justify-center">
					<div className="relative h-16 w-16 overflow-hidden rounded-md">
						<Image
							src={imageUrl}
							alt={
								image.translations.find((t) => t.language === "ja")?.title ||
								"ギャラリー画像"
							}
							fill
							className="object-cover"
							sizes="64px"
						/>
					</div>
				</div>
			);
		},
	},
	{
		accessorFn: (row) =>
			row.translations.find((t) => t.language === "ja")?.title || "無題",
		id: "title",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hover:bg-muted/50"
				>
					タイトル
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const image = row.original;
			const jaTranslation = image.translations.find((t) => t.language === "ja");
			const title = jaTranslation?.title || "無題";
			const description = jaTranslation?.description;

			return (
				<div className="flex flex-col gap-1">
					<div className="font-medium">{title}</div>
					{description && (
						<div className="text-sm text-muted-foreground line-clamp-1">
							{description}
						</div>
					)}
				</div>
			);
		},
	},
	{
		id: "hasLocation",
		header: "位置情報",
		accessorFn: (row) => row.latitude !== null && row.longitude !== null,
		cell: ({ row }) => {
			const image = row.original;
			const hasLocation = image.latitude !== null && image.longitude !== null;

			return hasLocation ? (
				<Badge variant="default" className="gap-1">
					<MapPin className="h-3 w-3" />
					あり
				</Badge>
			) : (
				<Badge variant="secondary">なし</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "takenAt",
		id: "takenAt",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hover:bg-muted/50"
				>
					撮影日時
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => <DateCell dateString={row.original.takenAt} />,
	},
	{
		accessorKey: "updatedAt",
		id: "updatedAt",
		header: "更新日時",
		cell: ({ row }) => <DateCell dateString={row.original.updatedAt} />,
		enableSorting: false,
	},
	{
		id: "actions",
		header: "アクション",
		cell: ({ row, table }) => {
			const meta = table.options.meta as { onAction?: () => void };
			return (
				<GalleryActions
					image={row.original}
					onAction={meta?.onAction || (() => {})}
				/>
			);
		},
	},
];
