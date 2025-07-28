"use client";

import { Edit, MoreHorizontal, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDeleteTag } from "../../../../entities/tag";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../../../../shared/ui/alert-dialog/alert-dialog";
import { Button } from "../../../../shared/ui/button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu/dropdown-menu";

/**
 * タグアクションのプロパティ
 */
interface TagActionsProps {
	/** タグ情報 */
	tag: {
		id: number;
		slug: string;
		name: string | null;
		articleCount: number;
	};
	/** アクション実行後のコールバック */
	onAction?: () => void;
}

/**
 * タグアクションメニューコンポーネント
 */
export function TagActions({ tag, onAction }: TagActionsProps) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// タグ削除フック
	const { mutate: deleteTag, isPending: isDeleting } = useDeleteTag({
		mutationConfig: {
			onSuccess: () => {
				setIsDeleteDialogOpen(false);
				onAction?.();
			},
			onError: (error) => {
				// エラー時の処理（将来的にはトーストで表示）
				console.error("タグの削除に失敗しました:", error.message);
			},
		},
	});

	/**
	 * 削除処理の実行
	 */
	const handleDelete = async () => {
		deleteTag(tag.id);
	};

	/**
	 * 削除ダイアログを開く
	 */
	const handleDeleteClick = () => {
		setIsDropdownOpen(false);
		setIsDeleteDialogOpen(true);
	};

	return (
		<>
			<DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="h-8 w-8 p-0"
						aria-label="アクションメニューを開く"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>アクション</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link
							href={`/admin/tags/${tag.id}/edit`}
							className="flex cursor-pointer items-center"
						>
							<Edit className="mr-2 h-4 w-4" />
							編集
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={handleDeleteClick}
						disabled={tag.articleCount > 0}
						className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
					>
						<Trash className="mr-2 h-4 w-4" />
						削除
						{tag.articleCount > 0 && (
							<span className="ml-auto text-xs text-muted-foreground">
								(使用中)
							</span>
						)}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* 削除確認ダイアログ */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>タグを削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							タグ「<strong>{tag.name || tag.slug}</strong>」を削除します。
							この操作は取り消すことができません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							キャンセル
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "削除中..." : "削除する"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
