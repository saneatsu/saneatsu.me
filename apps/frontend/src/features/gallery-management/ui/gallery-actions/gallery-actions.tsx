"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import type { GalleryImage } from "@/entities/gallery";
import { useDeleteGalleryImage } from "@/entities/gallery";
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
 * ギャラリーアクションコンポーネントのプロパティ
 */
interface GalleryActionsProps {
	/** 対象画像 */
	image: GalleryImage;
	/** アクション実行後のコールバック */
	onAction?: () => void;
}

/**
 * ギャラリーアクションコンポーネント
 *
 * @description
 * ギャラリー画像の編集・削除アクションを提供する。
 * 削除時は確認ダイアログを表示する。
 */
export function GalleryActions({ image, onAction }: GalleryActionsProps) {
	// ダイアログの状態管理
	const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
	const [errorDialog, setErrorDialog] = useState<{
		open: boolean;
		message: string;
	}>({ open: false, message: "" });

	// 画像削除フック
	const deleteImageMutation = useDeleteGalleryImage();

	// mutationが実行中かどうか
	const loading = deleteImageMutation.isPending;

	/**
	 * 削除確認ダイアログを表示
	 */
	const handleDeleteClick = () => {
		if (loading) return;
		setDeleteConfirmDialog(true);
	};

	/**
	 * 画像削除の実行
	 */
	const executeDelete = async () => {
		try {
			await deleteImageMutation.mutateAsync(image.id);
			const jaTranslation = image.translations.find((t) => t.language === "ja");
			const title = jaTranslation?.title || "画像";
			toast.success(`${title}を削除しました`);
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

	const jaTranslation = image.translations.find((t) => t.language === "ja");
	const title = jaTranslation?.title || "無題";

	return (
		<>
			<TooltipProvider>
				<div className="flex items-center gap-2">
					{/* 編集ボタン */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								asChild
								disabled={loading}
							>
								<Link href={`/admin/gallery/${image.id}/edit`}>
									<Pencil className="h-4 w-4" />
									<span className="sr-only">編集</span>
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>編集</TooltipContent>
					</Tooltip>

					{/* 削除ボタン */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
								onClick={handleDeleteClick}
								disabled={loading}
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">削除</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>削除</TooltipContent>
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
						<AlertDialogTitle>画像を削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							{title}を削除します。この操作は取り消せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={loading}>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={executeDelete}
							disabled={loading}
							className="bg-destructive hover:bg-destructive/90"
						>
							{loading ? "削除中..." : "削除"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* エラーダイアログ */}
			<AlertDialog
				open={errorDialog.open}
				onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}
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
							閉じる
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
