"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AddressSearch, useUploadGalleryImage } from "@/entities/gallery";
import { convertIsoToDatetimeLocal } from "@/shared/lib";
import {
	Button,
	type Coordinates,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Label,
	Textarea,
} from "@/shared/ui";

import {
	type GalleryImageUploadFormValues,
	galleryImageUploadSchema,
} from "./schema";

/**
 * ギャラリー画像アップロードダイアログのプロパティ
 */
export interface GalleryImageUploadDialogProps {
	/**
	 * ダイアログをトリガーするボタン
	 */
	trigger: React.ReactNode;

	/**
	 * アップロード成功時のコールバック
	 *
	 * @param markdown - Markdown形式の画像挿入テキスト
	 * @param imageId - Cloudflare Images ID
	 */
	onSuccess: (markdown: string, imageId: string) => void;
}

/**
 * ギャラリー画像アップロードダイアログコンポーネント
 *
 * @description
 * ギャラリー画像をアップロードするためのダイアログ。
 * 以下の機能を提供：
 * 1. 画像ファイル選択とプレビュー
 * 2. タイトル、説明、撮影日時の入力
 * 3. 住所検索による位置情報の設定
 * 4. フォームバリデーション
 * 5. アップロード処理とMarkdown生成
 *
 * @example
 * ```tsx
 * <GalleryImageUploadDialog
 *   trigger={<Button>ギャラリー画像をアップロード</Button>}
 *   onSuccess={(markdown, imageId) => {
 *     // エディタに挿入
 *     insertText(markdown);
 *   }}
 * />
 * ```
 */
export function GalleryImageUploadDialog({
	trigger,
	onSuccess,
}: GalleryImageUploadDialogProps) {
	// ダイアログの開閉状態
	const [isOpen, setIsOpen] = useState(false);
	// 画像プレビューURL
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	// 選択された住所
	const [selectedAddress, setSelectedAddress] = useState<string>("");

	// フォーム初期化
	const form = useForm<GalleryImageUploadFormValues>({
		resolver: zodResolver(galleryImageUploadSchema),
		defaultValues: {
			titleJa: "",
			descriptionJa: "",
			latitude: undefined,
			longitude: undefined,
			takenAt: undefined,
		},
	});

	// ギャラリー画像アップロードmutation
	const uploadImage = useUploadGalleryImage();

	/**
	 * ファイル選択ハンドラー
	 *
	 * @description
	 * 1. ファイルをフォームにセット
	 * 2. プレビュー用のObject URLを生成
	 */
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			form.setValue("file", file, { shouldValidate: true });

			// 既存のプレビューURLをクリーンアップ
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}

			// 新しいプレビューURLを生成
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	/**
	 * 住所選択ハンドラー
	 *
	 * @description
	 * 1. 座標をフォームにセット
	 * 2. 選択された住所を表示
	 */
	const handleAddressSelect = (coordinates: Coordinates, address: string) => {
		form.setValue("latitude", coordinates.latitude, { shouldValidate: true });
		form.setValue("longitude", coordinates.longitude, { shouldValidate: true });
		setSelectedAddress(address);
	};

	/**
	 * フォーム送信ハンドラー（イベント伝播防止用）
	 *
	 * @description
	 * ダイアログ内のフォーム送信イベントが親フォームに伝播するのを防ぐ。
	 * stopPropagation()を呼んでから、実際の送信処理を実行する。
	 */
	const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.stopPropagation();
		form.handleSubmit(onSubmitInternal)(event);
	};

	/**
	 * フォーム送信処理
	 *
	 * @description
	 * 1. ギャラリー画像をアップロード
	 * 2. Markdown形式のテキストを生成
	 * 3. 親コンポーネントにコールバック
	 * 4. ダイアログを閉じる
	 */
	const onSubmitInternal = async (data: GalleryImageUploadFormValues) => {
		try {
			const result = await uploadImage.mutateAsync({
				file: data.file,
				titleJa: data.titleJa,
				descriptionJa: data.descriptionJa,
				latitude: data.latitude,
				longitude: data.longitude,
				takenAt: data.takenAt,
			});

			// Markdown形式のテキストを生成
			const markdown = `![${data.titleJa}](${result.imageUrl})`;

			// 親コンポーネントにコールバック
			onSuccess(markdown, result.imageId);

			// ダイアログを閉じる
			setIsOpen(false);

			// フォームをリセット
			form.reset();
			setPreviewUrl(null);
			setSelectedAddress("");

			toast.success("ギャラリー画像をアップロードしました");
		} catch (error) {
			// エラーハンドリングはuseUploadGalleryImageで行われる
			console.error("Failed to upload gallery image:", error);
		}
	};

	/**
	 * ダイアログクローズ時のクリーンアップ
	 */
	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			// ダイアログを閉じるときにフォームとプレビューをリセット
			form.reset();
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				setPreviewUrl(null);
			}
			setSelectedAddress("");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>ギャラリー画像をアップロード</DialogTitle>
					<DialogDescription>
						ギャラリーに追加する画像の情報を入力してください。
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleFormSubmit} className="space-y-6">
						{/* 画像ファイル選択 */}
						<FormField
							control={form.control}
							name="file"
							render={({ field: { value, onChange, ...fieldProps } }) => (
								<FormItem>
									<FormLabel>画像ファイル</FormLabel>
									<FormControl>
										<div className="space-y-4">
											<Label
												htmlFor="file-upload"
												className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
											>
												<div className="flex flex-col items-center space-y-2">
													<Upload className="h-8 w-8 text-muted-foreground" />
													<span className="text-sm text-muted-foreground">
														クリックして画像を選択
													</span>
												</div>
												<Input
													id="file-upload"
													type="file"
													accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
													className="sr-only"
													onChange={handleFileChange}
													{...fieldProps}
												/>
											</Label>

											{/* 画像プレビュー */}
											{previewUrl && (
												<div className="relative w-full h-64 rounded-lg overflow-hidden border">
													<Image
														src={previewUrl}
														alt="プレビュー"
														fill
														className="object-contain"
													/>
												</div>
											)}
										</div>
									</FormControl>
									<FormDescription>
										jpg, jpeg, png, gif, webp形式の画像（最大10MB）
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* タイトル */}
						<FormField
							control={form.control}
							name="titleJa"
							render={({ field }) => (
								<FormItem>
									<FormLabel>タイトル（必須）</FormLabel>
									<FormControl>
										<Input placeholder="例: 東京タワーの夜景" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 説明 */}
						<FormField
							control={form.control}
							name="descriptionJa"
							render={({ field }) => (
								<FormItem>
									<FormLabel>説明</FormLabel>
									<FormControl>
										<Textarea
											placeholder="画像の説明を入力してください"
											className="resize-none"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 撮影日時 */}
						<FormField
							control={form.control}
							name="takenAt"
							render={({ field }) => (
								<FormItem>
									<FormLabel>撮影日時</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											{...field}
											value={
												field.value
													? convertIsoToDatetimeLocal(field.value)
													: ""
											}
											onChange={(e) => {
												if (e.target.value) {
													// datetime-local形式からISO 8601形式に変換
													const date = new Date(e.target.value);
													field.onChange(date.toISOString());
												} else {
													field.onChange(undefined);
												}
											}}
										/>
									</FormControl>
									<FormDescription>
										画像が撮影された日時を選択してください
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 位置情報 */}
						<div className="space-y-4">
							<FormLabel>位置情報</FormLabel>
							<AddressSearch
								onSelect={handleAddressSelect}
								placeholder="住所を検索（例: 東京タワー）"
							/>

							{/* 選択された住所の表示 */}
							{selectedAddress && (
								<div className="text-sm text-muted-foreground">
									選択された住所: {selectedAddress}
								</div>
							)}

							{/* 座標の表示 */}
							{form.watch("latitude") !== undefined &&
								form.watch("longitude") !== undefined && (
									<div className="text-sm text-muted-foreground">
										座標: {form.watch("latitude")?.toFixed(6)},{" "}
										{form.watch("longitude")?.toFixed(6)}
									</div>
								)}
						</div>

						{/* アクションボタン */}
						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
								disabled={uploadImage.isPending}
							>
								キャンセル
							</Button>
							<Button
								type="submit"
								disabled={uploadImage.isPending || !form.formState.isValid}
							>
								{uploadImage.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								アップロード
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
