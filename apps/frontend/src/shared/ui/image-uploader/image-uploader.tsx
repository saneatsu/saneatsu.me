"use client";

import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ImageCropper,
	Label,
} from "@/shared/ui";

/**
 * 画像アップローダーのプロパティ
 */
export interface ImageUploaderProps {
	/** 既存の画像URL（編集時のみ） */
	imageUrl?: string | null;
	/** クロッピング機能を有効にするか */
	enableCropping?: boolean;
	/** モード: 'create'=新規作成時、'edit'=編集時 */
	mode?: "create" | "edit";
	/** アップロードAPI関数（編集モード用） */
	onUpload?: (file: File) => Promise<{ imageUrl: string; imageId: string }>;
	/** 削除API関数（編集モード用） */
	onDelete?: () => Promise<void>;
	/** ファイル選択時のコールバック（作成モード用） */
	onFileSelect?: (file: File | null) => void;
	/** アップロード成功時のコールバック */
	onUploadSuccess?: (imageUrl: string, imageId: string) => void;
	/** 削除成功時のコールバック */
	onDeleteSuccess?: () => void;
	/** エラー発生時のコールバック */
	onError?: (error: string) => void;
	/** 無効化フラグ */
	disabled?: boolean;
	/** ラベルテキスト */
	label?: string;
	/** ヘルプテキスト */
	helpText?: string;
}

/**
 * 汎用画像アップロードコンポーネント
 *
 * @description
 * 画像のアップロード・削除・クロッピングを行う汎用コンポーネント。
 *
 * 機能:
 * 1. 画像ファイルを選択（画像ファイルのみ）
 * 2. 選択した画像のプレビュー表示
 * 3. クロッピング機能（enableCropping=true の場合）
 * 4. 既存の画像の表示
 * 5. アップロードボタン（編集モードのみ）
 * 6. 削除ボタン（編集モードかつ画像がある場合のみ）
 *
 * @example
 * // クロッピングあり（ギャラリー用）
 * <ImageUploader
 *   mode="create"
 *   enableCropping={true}
 *   aspectRatio={null}
 *   onFileSelect={(file) => setFile(file)}
 *   label="ギャラリー画像"
 * />
 *
 * // クロッピングなし（記事サムネイル用）
 * <ImageUploader
 *   mode="edit"
 *   enableCropping={false}
 *   imageUrl={thumbnailUrl}
 *   onUpload={uploadFunction}
 *   onDelete={deleteFunction}
 *   label="サムネイル画像"
 * />
 */
export function ImageUploader({
	imageUrl,
	enableCropping = false,
	mode = "edit",
	onUpload,
	onDelete,
	onFileSelect,
	onUploadSuccess,
	onDeleteSuccess,
	onError,
	disabled = false,
	label = "画像",
	helpText,
}: ImageUploaderProps) {
	// ファイル選択と表示
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// クロッピング関連
	const [cropperUrl, setCropperUrl] = useState<string | null>(null);
	const [showCropper, setShowCropper] = useState(false);
	const [_croppedFile, setCroppedFile] = useState<File | null>(null);

	// ダイアログ関連
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// ローディング状態
	const [isUploading, setIsUploading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const isLoading = isUploading || isDeleting;

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

		// クロッピングが有効な場合
		if (enableCropping) {
			// クロッピング用のURLを生成して表示
			const url = URL.createObjectURL(file);
			setCropperUrl(url);
			setShowCropper(true);
		} else {
			// クロッピングなしの場合、そのままプレビュー
			setSelectedFile(file);

			// プレビューURLを生成
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);

			// 作成モードの場合、親コンポーネントにファイルを通知
			if (mode === "create") {
				onFileSelect?.(file);
			}
		}
	};

	/**
	 * クロップ完了ハンドラー
	 */
	const handleCropComplete = (croppedBlob: Blob) => {
		// BlobをFileに変換
		const file = new File([croppedBlob], "cropped-image.jpg", {
			type: "image/jpeg",
		});

		// プレビューURLを生成
		const url = URL.createObjectURL(croppedBlob);
		setPreviewUrl(url);
		setCroppedFile(file);
		setSelectedFile(file);

		// 作成モードの場合、親コンポーネントにファイルを通知
		if (mode === "create") {
			onFileSelect?.(file);
		}

		// クロッパーを閉じる
		setShowCropper(false);

		// cropperUrlのクリーンアップ
		if (cropperUrl) {
			URL.revokeObjectURL(cropperUrl);
			setCropperUrl(null);
		}
	};

	/**
	 * クロップキャンセルハンドラー
	 */
	const handleCropCancel = () => {
		setShowCropper(false);

		// cropperUrlのクリーンアップ
		if (cropperUrl) {
			URL.revokeObjectURL(cropperUrl);
			setCropperUrl(null);
		}

		// ファイル入力をリセット
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	/**
	 * プレビュー画像クリックで再クロップ
	 */
	const handlePreviewClick = () => {
		if (!enableCropping || !displayUrl) return;

		setCropperUrl(displayUrl);
		setShowCropper(true);
	};

	/**
	 * アップロード処理
	 */
	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("ファイルが選択されていません");
			return;
		}

		if (!onUpload) {
			toast.error("アップロード関数が指定されていません");
			return;
		}

		try {
			setIsUploading(true);
			const result = await onUpload(selectedFile);

			toast.success("画像をアップロードしました");

			// プレビューをクリア
			setSelectedFile(null);
			setCroppedFile(null);
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
				error && typeof error === "object" && "message" in error
					? (error as { message: string }).message
					: "画像のアップロードに失敗しました";

			toast.error(errorMessage);
			onError?.(errorMessage);
		} finally {
			setIsUploading(false);
		}
	};

	/**
	 * 削除処理
	 */
	const handleDelete = async () => {
		if (!onDelete) {
			toast.error("削除関数が指定されていません");
			return;
		}

		try {
			setIsDeleting(true);
			await onDelete();

			toast.success("画像を削除しました");

			// ダイアログを閉じる
			setShowDeleteDialog(false);

			// コールバックを実行
			onDeleteSuccess?.();
		} catch (error) {
			console.error("削除エラー:", error);

			const errorMessage =
				error && typeof error === "object" && "message" in error
					? (error as { message: string }).message
					: "画像の削除に失敗しました";

			toast.error(errorMessage);
			onError?.(errorMessage);
		} finally {
			setIsDeleting(false);
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
		setCroppedFile(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewUrl(null);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}

		// 作成モードの場合、親コンポーネントにクリアを通知
		if (mode === "create") {
			onFileSelect?.(null);
		}
	};

	// 表示する画像URL（優先度: プレビュー > 既存画像）
	const displayUrl = previewUrl || imageUrl;

	return (
		<div className="space-y-4">
			<Label>{label}</Label>

			{/* 画像プレビュー */}
			{displayUrl && (
				// biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useAriaPropsSupportedByRole: 画像プレビュー領域全体をクリック可能にするためdivを使用
				<div
					className={`relative w-full max-w-md aspect-video rounded-lg border overflow-hidden bg-muted ${enableCropping && displayUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
					onClick={
						enableCropping && displayUrl ? handlePreviewClick : undefined
					}
					onKeyDown={
						enableCropping && displayUrl
							? (e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handlePreviewClick();
									}
								}
							: undefined
					}
					role={enableCropping && displayUrl ? "button" : undefined}
					tabIndex={enableCropping && displayUrl ? 0 : undefined}
					aria-label={
						enableCropping && displayUrl
							? "画像をクリックして再クロップ"
							: undefined
					}
				>
					<Image
						src={displayUrl}
						alt="画像プレビュー"
						fill
						className="object-cover"
					/>
					{enableCropping && displayUrl && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
							<p className="text-white text-sm font-medium">
								クリックして再クロップ
							</p>
						</div>
					)}
				</div>
			)}

			{/* ファイル選択とプレビューなし時の表示 */}
			{!displayUrl && (
				<div className="w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
					<div className="text-center space-y-2">
						<ImagePlus className="h-12 w-12 mx-auto text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							画像を選択してください
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
						disabled={disabled || isLoading}
					>
						<ImagePlus className="mr-2 h-4 w-4" />
						画像を選択
					</Button>
				)}

				{/* アップロードボタン（ファイル選択時、編集モードのみ表示） */}
				{selectedFile && previewUrl && mode === "edit" && (
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

				{/* 作成モードでファイル選択時はキャンセルボタンのみ表示 */}
				{selectedFile && previewUrl && mode === "create" && (
					<Button
						type="button"
						variant="outline"
						onClick={handleClearSelection}
						disabled={disabled || isLoading}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						削除
					</Button>
				)}

				{/* 削除ボタン（既存画像があり、プレビューがない場合、編集モードのみ表示） */}
				{imageUrl && !previewUrl && mode === "edit" && (
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
			{helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}

			{/* 画像クロップダイアログ */}
			{enableCropping && (
				<Dialog
					open={showCropper && !!cropperUrl}
					onOpenChange={setShowCropper}
				>
					<DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
						<DialogHeader className="px-6 pt-6">
							<DialogTitle>画像をクロップ</DialogTitle>
						</DialogHeader>
						<div className="flex-1 min-h-0">
							{cropperUrl && (
								<ImageCropper
									imageSrc={cropperUrl}
									onCropComplete={handleCropComplete}
									onCancel={handleCropCancel}
								/>
							)}
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* 削除確認ダイアログ */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>画像を削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							この操作は取り消せません。画像を完全に削除します。
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
