"use client";

import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useDeleteTag } from "@/entities/tag";
import type { Tag } from "@/shared/model";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui";

/**
 * TagActionsコンポーネントのProps
 */
interface TagActionsProps {
	/** 操作対象のタグ */
	tag: Tag;
}

/**
 * タグアクションドロップダウンメニュー
 *
 * @description
 * タグテーブルの各行に表示されるアクションメニュー。
 *
 * アクション:
 * - 編集: タグ編集ページへ遷移
 * - 削除: タグを削除（記事との紐づけも削除）
 */
export function TagActions({ tag }: TagActionsProps) {
	// ダイアログの状態管理
	const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
	const [errorDialog, setErrorDialog] = useState<{
		open: boolean;
		message: string;
	}>({ open: false, message: "" });

	// タグ削除フック
	const deleteTagMutation = useDeleteTag();

	// mutationが実行中かどうか
	const loading = deleteTagMutation.isPending;

	/**
	 * 削除確認ダイアログを表示
	 */
	const handleDeleteClick = () => {
		if (loading) return;
		setDeleteConfirmDialog(true);
	};

	/**
	 * タグ削除の実行
	 */
	const executeDelete = async () => {
		try {
			await deleteTagMutation.mutateAsync(tag.id);
			toast.success(`タグ「${tag.slug}」を削除しました`);
			setDeleteConfirmDialog(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "削除に失敗しました";
			setDeleteConfirmDialog(false);
			setErrorDialog({
				open: true,
				message: `削除に失敗しました: ${errorMessage}`,
			});
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
						<span className="sr-only">アクションメニューを開く</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{/* 編集アクション */}
					<DropdownMenuItem asChild>
						<Link href={`/admin/tags/${tag.id}/edit`}>
							<Edit className="mr-2 h-4 w-4" />
							編集
						</Link>
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					{/* 削除アクション */}
					<DropdownMenuItem
						onClick={handleDeleteClick}
						className="text-destructive focus:text-destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						削除
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* 削除確認ダイアログ */}
			<AlertDialog
				open={deleteConfirmDialog}
				onOpenChange={setDeleteConfirmDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>タグの削除</AlertDialogTitle>
						<AlertDialogDescription>
							タグ「{tag.slug}
							」を削除しますか？
							<br />
							<strong>
								このタグが付けられているすべての記事からもタグが削除されます。
							</strong>
							<br />
							この操作は取り消せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={executeDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							削除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* エラーダイアログ */}
			<AlertDialog
				open={errorDialog.open}
				onOpenChange={(open) =>
					setErrorDialog({ open, message: errorDialog.message })
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>エラー</AlertDialogTitle>
						<AlertDialogDescription>
							{errorDialog.message}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => setErrorDialog({ open: false, message: "" })}
						>
							OK
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
