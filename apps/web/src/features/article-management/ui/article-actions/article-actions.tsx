"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useDelete } from "@/entities/article";
import type { Article } from "@/shared/model";
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/ui";

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
 * プレビュー・削除などのアクションを提供
 */
export function ArticleActions({ article, onAction }: ArticleActionsProps) {
	// ダイアログの状態管理
	const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
	const [errorDialog, setErrorDialog] = useState<{
		open: boolean;
		message: string;
	}>({ open: false, message: "" });

	// 記事削除フック
	const deleteArticleMutation = useDelete();

	// mutationが実行中かどうか
	const loading = deleteArticleMutation.isPending;

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
	 * 記事プレビュー
	 */
	const handlePreview = () => {
		// 日本語版の記事詳細ページを新しいタブで開く
		window.open(`/ja/blog/${article.slug}`, "_blank");
	};

	return (
		<>
			<TooltipProvider>
				<div className="flex items-center gap-2">
					{/* プレビューボタン */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handlePreview}
								disabled={loading}
							>
								<ExternalLink className="h-4 w-4" />
								<span className="sr-only">プレビュー</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>プレビュー</p>
						</TooltipContent>
					</Tooltip>

					{/* 削除ボタン */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-destructive hover:text-destructive/90"
								onClick={handleDeleteClick}
								disabled={loading}
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">削除</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>削除</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>

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
				onOpenChange={(isOpen) =>
					setErrorDialog({ open: isOpen, message: errorDialog.message })
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
