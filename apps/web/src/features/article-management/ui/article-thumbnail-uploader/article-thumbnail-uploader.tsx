"use client";

import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useDeleteThumbnail, useUploadThumbnail } from "@/entities/article";
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
	Label,
} from "@/shared/ui";

/**
 * サムネイル画像アップローダーのプロパティ
 */
export interface ArticleThumbnailUploaderProps {
	/** 記事ID（編集時のみ） */
	articleId?: number;
	/** 既存のサムネイルURL（編集時のみ） */
	thumbnailUrl?: string | null;
	/** アップロード成功時のコールバック */
	onUploadSuccess?: (imageUrl: string, imageId: string) => void;
	/** 削除成功時のコールバック */
	onDeleteSuccess?: () => void;
	/** エラー発生時のコールバック */
	onError?: (error: string) => void;
	/** 無効化フラグ */
	disabled?: boolean;
}

/**
 * サムネイル画像アップロード・削除UIコンポーネント
 *
 * @description
 * 記事のサムネイル画像をアップロード・削除するためのUIコンポーネント。
 *
 * 機能:
 * 1. 画像ファイルを選択（画像ファイルのみ）
 * 2. 選択した画像のプレビュー表示
 * 3. 既存のサムネイル画像の表示
 * 4. アップロードボタン
 * 5. 削除ボタン（サムネイルがある場合のみ）
 *
 * @example
 * // 新規作成時（articleIdなし）
 * <ArticleThumbnailUploader
 *   onUploadSuccess={(url, id) => console.log(url, id)}
 * />
 *
 * // 編集時（articleIdあり、既存サムネイルあり）
 * <ArticleThumbnailUploader
 *   articleId={123}
 *   thumbnailUrl="https://example.com/image.jpg"
 *   onUploadSuccess={(url, id) => console.log(url, id)}
 *   onDeleteSuccess={() => console.log("削除成功")}
 * />
 */
export function ArticleThumbnailUploader({
	articleId,
	thumbnailUrl,
	onUploadSuccess,
	onDeleteSuccess,
	onError,
	disabled = false,
}: ArticleThumbnailUploaderProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const uploadMutation = useUploadThumbnail();
	const deleteMutation = useDeleteThumbnail();

	/**
	 * ファイル選択処理
	 */
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];

		if (!file) return;

		// 画像ファイルのみ許可
		if (!file.type.startsWith("image/")) {
			toast.error("画像ファイルを選択してください");
			return;
		}

		// ファイルサイズチェック（10MB以下）
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			toast.error("ファイルサイズは10MB以下にしてください");
			return;
		}

		setSelectedFile(file);

		// プレビューURLを生成
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
	};

	/**
	 * アップロード処理
	 */
	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("ファイルが選択されていません");
			return;
		}

		if (!articleId) {
			toast.error("記事IDが指定されていません。記事を先に保存してください。");
			return;
		}

		try {
			const result = await uploadMutation.mutateAsync({
				articleId,
				file: selectedFile,
			});

			toast.success("サムネイル画像をアップロードしました");

			// プレビューをクリア
			setSelectedFile(null);
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			setPreviewUrl(null);

			// ファイル入力をリセット
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			// コールバックを実行
			onUploadSuccess?.(result.imageUrl, result.imageId);
		} catch (error) {
			console.error("アップロードエラー:", error);

			const errorMessage =
				error && typeof error === "object" && "error" in error
					? (error.error as { message: string }).message
					: "サムネイル画像のアップロードに失敗しました";

			toast.error(errorMessage);
			onError?.(errorMessage);
		}
	};

	/**
	 * 削除処理
	 */
	const handleDelete = async () => {
		if (!articleId) {
			toast.error("記事IDが指定されていません");
			return;
		}

		try {
			await deleteMutation.mutateAsync({ articleId });

			toast.success("サムネイル画像を削除しました");

			// ダイアログを閉じる
			setShowDeleteDialog(false);

			// コールバックを実行
			onDeleteSuccess?.();
		} catch (error) {
			console.error("削除エラー:", error);

			const errorMessage =
				error && typeof error === "object" && "error" in error
					? (error.error as { message: string }).message
					: "サムネイル画像の削除に失敗しました";

			toast.error(errorMessage);
			onError?.(errorMessage);
		}
	};

	/**
	 * ファイル選択ダイアログを開く
	 */
	const handleSelectClick = () => {
		fileInputRef.current?.click();
	};

	/**
	 * 選択をクリア
	 */
	const handleClearSelection = () => {
		setSelectedFile(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewUrl(null);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// 表示する画像URL（優先度: プレビュー > 既存サムネイル）
	const displayUrl = previewUrl || thumbnailUrl;

	// ローディング状態
	const isUploading = uploadMutation.isPending;
	const isDeleting = deleteMutation.isPending;
	const isLoading = isUploading || isDeleting;

	return (
		<div className="space-y-4">
			<Label>サムネイル画像</Label>

			{/* 画像プレビュー */}
			{displayUrl && (
				<div className="relative w-full max-w-md aspect-video rounded-lg border overflow-hidden bg-muted">
					<Image
						src={displayUrl}
						alt="サムネイルプレビュー"
						fill
						className="object-cover"
					/>
				</div>
			)}

			{/* ファイル選択とプレビューなし時の表示 */}
			{!displayUrl && (
				<div className="w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
					<div className="text-center space-y-2">
						<ImagePlus className="h-12 w-12 mx-auto text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							サムネイルを選択してください（オプション）
						</p>
					</div>
				</div>
			)}

			{/* ファイル入力（非表示） */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
				disabled={disabled || isLoading}
			/>

			{/* コントロールボタン */}
			<div className="flex gap-2 flex-wrap">
				{/* ファイル選択ボタン */}
				{!previewUrl && (
					<Button
						type="button"
						variant="outline"
						onClick={handleSelectClick}
						disabled={disabled || isLoading || !articleId}
					>
						<ImagePlus className="mr-2 h-4 w-4" />
						画像を選択
					</Button>
				)}

				{/* アップロードボタン（ファイル選択時のみ表示） */}
				{selectedFile && previewUrl && (
					<>
						<Button
							type="button"
							onClick={handleUpload}
							disabled={disabled || isLoading}
						>
							{isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							<Upload className="mr-2 h-4 w-4" />
							{isUploading ? "アップロード中..." : "アップロード"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleClearSelection}
							disabled={disabled || isLoading}
						>
							キャンセル
						</Button>
					</>
				)}

				{/* 削除ボタン（既存サムネイルがあり、プレビューがない場合のみ表示） */}
				{thumbnailUrl && !previewUrl && (
					<Button
						type="button"
						variant="destructive"
						onClick={() => setShowDeleteDialog(true)}
						disabled={disabled || isLoading}
					>
						{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						<Trash2 className="mr-2 h-4 w-4" />
						{isDeleting ? "削除中..." : "削除"}
					</Button>
				)}
			</div>

			{/* ヘルプテキスト */}
			<p className="text-sm text-muted-foreground">
				{!articleId
					? "※ サムネイル画像は記事を保存した後にアップロードできます"
					: "推奨サイズ: 横800px × 縦600px、10MB以下"}
			</p>

			{/* 削除確認ダイアログ */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>サムネイル画像を削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							この操作は取り消せません。サムネイル画像を完全に削除します。
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
							{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							削除する
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
