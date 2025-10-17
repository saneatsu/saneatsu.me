"use client";

import { Edit, Eye, FileEdit, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDelete, useUpdateStatus } from "../../../../entities/article/api";
import type { Article } from "../../../../shared/model/article";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../../../shared/ui/alert-dialog/alert-dialog";
import { Button } from "../../../../shared/ui/button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu/dropdown-menu";

/**
 * 記事アクションコンポーネントのプロパティ
 */
interface ArticleActionsProps {
	/** 対象記事 */
	article: Article;
	/** アクション実行後のコールバック */
	onAction?: () => void;
}

/**
 * 記事アクションコンポーネント
 * 編集・削除・ステータス変更などのアクションを提供
 */
export function ArticleActions({ article, onAction }: ArticleActionsProps) {
	// ダイアログの状態管理
	const [statusConfirmDialog, setStatusConfirmDialog] = useState<{
		open: boolean;
		newStatus: string;
	}>({ open: false, newStatus: "" });
	const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
	const [errorDialog, setErrorDialog] = useState<{
		open: boolean;
		message: string;
	}>({ open: false, message: "" });

	// 記事ステータス更新フック
	const updateStatusMutation = useUpdateStatus();

	// 記事削除フック
	const deleteArticleMutation = useDelete();

	// いずれかのmutationが実行中かどうか
	const loading =
		updateStatusMutation.isPending || deleteArticleMutation.isPending;

	/**
	 * ステータス更新の確認ダイアログを表示
	 */
	const handleStatusUpdateClick = (newStatus: string) => {
		if (loading) return;
		setStatusConfirmDialog({ open: true, newStatus });
	};

	/**
	 * 記事ステータス更新の実行
	 */
	const executeStatusUpdate = async () => {
		try {
			await updateStatusMutation.mutateAsync({
				id: article.id,
				status: statusConfirmDialog.newStatus,
			});
			onAction?.();
			setStatusConfirmDialog({ open: false, newStatus: "" });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "ステータス更新に失敗しました";
			setStatusConfirmDialog({ open: false, newStatus: "" });
			setErrorDialog({
				open: true,
				message: `ステータス更新に失敗しました: ${errorMessage}`,
			});
		}
	};

	/**
	 * 削除確認ダイアログを表示
	 */
	const handleDeleteClick = () => {
		if (loading) return;
		setDeleteConfirmDialog(true);
	};

	/**
	 * 記事削除の実行
	 */
	const executeDelete = async () => {
		try {
			await deleteArticleMutation.mutateAsync(article.id);
			toast.success(`記事「${article.title || article.slug}」を削除しました`);
			onAction?.();
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

	/**
	 * 記事編集ページへ移動
	 */
	const handleEdit = () => {
		window.location.href = `/admin/articles/${article.id}/edit`;
	};

	/**
	 * 記事プレビュー
	 */
	const handlePreview = () => {
		// 日本語版の記事詳細ページを新しいタブで開く
		window.open(`/ja/articles/${article.slug}`, "_blank");
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
					{/* 基本アクション */}
					<DropdownMenuItem onClick={handleEdit}>
						<Edit className="mr-2 h-4 w-4" />
						編集
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handlePreview}>
						<Eye className="mr-2 h-4 w-4" />
						プレビュー
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					{/* ステータス変更 */}
					{article.status !== "published" && (
						<DropdownMenuItem
							onClick={() => handleStatusUpdateClick("published")}
							className="text-green-600"
						>
							<FileEdit className="mr-2 h-4 w-4" />
							公開する
						</DropdownMenuItem>
					)}

					{article.status !== "draft" && (
						<DropdownMenuItem
							onClick={() => handleStatusUpdateClick("draft")}
							className="text-yellow-600"
						>
							<FileEdit className="mr-2 h-4 w-4" />
							下書きに戻す
						</DropdownMenuItem>
					)}

					{article.status !== "archived" && (
						<DropdownMenuItem
							onClick={() => handleStatusUpdateClick("archived")}
							className="text-gray-600"
						>
							<FileEdit className="mr-2 h-4 w-4" />
							アーカイブ
						</DropdownMenuItem>
					)}

					<DropdownMenuSeparator />

					{/* 削除アクション */}
					<DropdownMenuItem
						onClick={handleDeleteClick}
						className="text-red-600 focus:text-red-600"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						削除
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* ステータス更新確認ダイアログ */}
			<AlertDialog
				open={statusConfirmDialog.open}
				onOpenChange={(open) =>
					setStatusConfirmDialog({
						open,
						newStatus: statusConfirmDialog.newStatus,
					})
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>ステータス変更の確認</AlertDialogTitle>
						<AlertDialogDescription>
							記事「{article.title || article.slug}」のステータスを「
							{statusConfirmDialog.newStatus}」に変更しますか？
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={executeStatusUpdate}>
							変更
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* 削除確認ダイアログ */}
			<AlertDialog
				open={deleteConfirmDialog}
				onOpenChange={setDeleteConfirmDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>記事の削除</AlertDialogTitle>
						<AlertDialogDescription>
							記事「{article.title || article.slug}
							」を削除しますか？この操作は取り消せません。
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
