"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
	AddressSearch,
	useGetGalleryImageById,
	useUpdateGalleryImage,
	useUploadGalleryImage,
} from "@/entities/gallery";
import {
	Button,
	CoordinatesInput,
	DateTimePicker,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Label,
	Mapbox,
	Textarea,
} from "@/shared/ui";

import { GalleryImageStatusSelector } from "../gallery-image-status-selector/gallery-image-status-selector";

/**
 * ギャラリーフォームのスキーマを生成する関数
 *
 * @description
 * 作成モードでは画像ファイルが必須。
 * 編集モードでは画像ファイルフィールドは含まれない（バックエンドAPIが画像差し替えをサポートしていないため）。
 *
 * @param mode - "create" または "edit"
 * @returns zodスキーマ
 */
const createGalleryFormSchema = (mode: "create" | "edit") => {
	const baseSchema = {
		/** 日本語タイトル（必須） */
		titleJa: z.string().min(1, { message: "タイトルを入力してください" }),
		/** 日本語説明 */
		descriptionJa: z.string().optional(),
		/** 撮影日時 */
		takenAt: z.date().optional(),
		/** 座標 */
		coordinates: z
			.object({
				latitude: z.number(),
				longitude: z.number(),
			})
			.nullable()
			.optional(),
		/** ステータス */
		status: z.enum(["published", "draft"], {
			message: "ステータスを選択してください",
		}),
	};

	if (mode === "create") {
		return z.object({
			/** 画像ファイル（作成時のみ必須） */
			file: z
				.instanceof(File, { message: "画像ファイルを選択してください" })
				.refine((file) => file.size <= 10 * 1024 * 1024, {
					message: "ファイルサイズは10MB以下にしてください",
				})
				.refine(
					(file) =>
						["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
							file.type
						),
					{
						message: "JPEG、PNG、GIF、WebP形式の画像のみアップロード可能です",
					}
				),
			...baseSchema,
		});
	}

	return z.object(baseSchema);
};

type GalleryFormValues = z.infer<ReturnType<typeof createGalleryFormSchema>>;

/**
 * ギャラリーフォームコンポーネントのプロパティ
 */
interface GalleryFormProps {
	/** フォームモード（作成 or 編集） */
	mode?: "create" | "edit";
	/** 編集対象の画像ID（編集モード時のみ） */
	imageId?: number;
}

/**
 * ギャラリーフォームコンポーネント
 *
 * @description
 * ギャラリー画像の作成・編集を行うフォーム。
 *
 * モード:
 * - create: 新規画像のアップロード（画像ファイル必須）
 * - edit: 既存画像の編集（画像ファイルはオプショナル、差し替える場合のみ選択）
 *
 * フィールド:
 * 1. 画像ファイル（作成時は必須、編集時はオプショナル、最大10MB、JPEG/PNG/GIF/WebP）
 * 2. 日本語タイトル・説明
 * 3. 撮影日時
 * 4. 位置情報（住所検索、座標入力、地図選択）
 */
export function GalleryForm({ mode = "create", imageId }: GalleryFormProps) {
	const router = useRouter();
	const uploadImage = useUploadGalleryImage();
	const updateImage = useUpdateGalleryImage();

	// 編集モード時に既存データを取得
	const { data: existingImage, isLoading: isLoadingImage } =
		useGetGalleryImageById({
			id: imageId || 0,
			language: "ja",
			queryConfig: {
				enabled: mode === "edit" && !!imageId,
			},
		});

	// プレビュー画像URL
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// フォーム設定
	const form = useForm<GalleryFormValues>({
		resolver: zodResolver(createGalleryFormSchema(mode)),
		defaultValues: {
			titleJa: "",
			descriptionJa: "",
			coordinates: null,
			status: "draft",
		},
	});

	/**
	 * 編集モード時に既存データをフォームに設定
	 */
	useEffect(() => {
		if (mode === "edit" && existingImage) {
			const jaTranslation = existingImage.translations.find(
				(t) => t.language === "ja"
			);

			form.reset({
				titleJa: jaTranslation?.title || "",
				descriptionJa: jaTranslation?.description || "",
				takenAt:
					existingImage.takenAt &&
					!Number.isNaN(new Date(existingImage.takenAt).getTime())
						? new Date(existingImage.takenAt)
						: undefined,
				coordinates:
					existingImage.latitude && existingImage.longitude
						? {
								latitude: existingImage.latitude,
								longitude: existingImage.longitude,
							}
						: null,
				status: existingImage.status,
			});
		}
	}, [mode, existingImage, form]);

	/**
	 * ファイル選択ハンドラー（作成モードのみ使用）
	 */
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			setPreviewUrl(null);
			return;
		}

		// プレビューURLを生成
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);

		// フォームに設定（作成モードでのみfileフィールドが存在）
		if (mode === "create") {
			// @ts-expect-error - 作成モードでのみfileフィールドが存在するため
			form.setValue("file", file, { shouldValidate: true });
		}
	};

	/**
	 * フォーム送信ハンドラー
	 */
	const onSubmit = async (data: GalleryFormValues) => {
		try {
			if (mode === "edit") {
				// 編集モード
				if (!imageId) {
					toast.error("画像IDが指定されていません");
					return;
				}

				// 翻訳データの構築（titleJaは必須）
				const translations = [
					{
						language: "ja" as const,
						title: data.titleJa,
						description: data.descriptionJa,
					},
				];

				await updateImage.mutateAsync({
					id: imageId,
					data: {
						translations,
						latitude: data.coordinates?.latitude,
						longitude: data.coordinates?.longitude,
						takenAt: data.takenAt?.toISOString(),
						status: data.status,
					},
				});

				toast.success("ギャラリー画像を更新しました");
			} else {
				// 作成モード
				// 型安全性のため、fileの存在をチェック（作成モードではschemaで必須なので通常は存在する）
				if (!("file" in data) || !data.file) {
					toast.error("画像ファイルを選択してください");
					return;
				}

				// この時点でdata.fileは確実に存在する（作成モードかつバリデーション通過）
				await uploadImage.mutateAsync({
					file: data.file as File,
					titleJa: data.titleJa,
					descriptionJa: data.descriptionJa,
					latitude: data.coordinates?.latitude,
					longitude: data.coordinates?.longitude,
					takenAt: data.takenAt?.toISOString(),
				});

				toast.success("ギャラリー画像をアップロードしました");
			}

			router.push("/admin/gallery");
		} catch (error) {
			const errorMessage =
				mode === "edit"
					? "ギャラリー画像の更新に失敗しました"
					: "ギャラリー画像のアップロードに失敗しました";

			toast.error(error instanceof Error ? error.message : errorMessage);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				{/* 画像ファイル（作成モードのみ表示） */}
				{mode === "create" && (
					<FormField
						control={form.control}
						// @ts-expect-error - 作成モードでのみfileフィールドが存在するため
						name="file"
						render={() => (
							<FormItem>
								<FormLabel>画像ファイル *</FormLabel>
								<FormControl>
									<div className="space-y-4">
										<Input
											type="file"
											accept="image/jpeg,image/png,image/gif,image/webp"
											onChange={handleFileChange}
										/>
										{previewUrl && (
											<div className="border rounded-lg p-4">
												{/* biome-ignore lint/performance/noImgElement: blob URLを使用しているためNext.js Imageコンポーネントは使用不可 */}
												<img
													src={previewUrl}
													alt="プレビュー"
													className="max-w-full h-auto max-h-96 mx-auto"
												/>
											</div>
										)}
									</div>
								</FormControl>
								<FormDescription>
									JPEG、PNG、GIF、WebP形式の画像（最大10MB）
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{/* 画像情報 */}
				<div className="space-y-4">
					<div className="space-y-2">
						<h3 className="font-semibold">画像情報</h3>
						<p className="text-sm text-muted-foreground">
							日本語で入力してください。自動的に英語に翻訳されます。
						</p>
					</div>

					<FormField
						control={form.control}
						name="titleJa"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="required">タイトル</FormLabel>
								<FormControl>
									<Input {...field} placeholder="例: 東京タワーの夕景" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="descriptionJa"
						render={({ field }) => (
							<FormItem>
								<FormLabel>説明</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="例: 2024年12月に東京タワーを訪れた際に撮影した写真"
										rows={3}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* 撮影日時 */}
				<FormField
					control={form.control}
					name="takenAt"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>撮影日時</FormLabel>
							<FormControl>
								<DateTimePicker
									value={field.value}
									onChange={field.onChange}
									granularity="minute"
								/>
							</FormControl>
							<FormDescription>
								写真が撮影された日時を設定できます
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* ステータス */}
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<GalleryImageStatusSelector
								value={field.value}
								onValueChange={field.onChange}
								statuses={["draft", "published"]}
								label="ステータス"
								required
								error={form.formState.errors.status?.message}
							/>
						</FormItem>
					)}
				/>

				{/* 位置情報 */}
				<div className="space-y-4">
					<h3 className="font-semibold">位置情報</h3>

					{/* 2カラムグリッド: 住所検索+座標入力 | 地図 */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* 左カラム: 住所検索 + 座標入力 */}
						<div className="space-y-4">
							{/* 住所検索 */}
							<div className="space-y-2">
								<Label>住所検索</Label>
								<AddressSearch
									onSelect={(coords, _address) => {
										form.setValue("coordinates", coords, {
											shouldValidate: true,
										});
									}}
									placeholder="住所を入力して検索"
								/>
							</div>

							{/* 座標入力 */}
							<FormField
								control={form.control}
								name="coordinates"
								render={({ field }) => (
									<FormItem>
										<FormLabel>座標</FormLabel>
										<FormControl>
											<CoordinatesInput
												value={field.value ?? null}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormDescription>
											緯度・経度を直接入力、または地図上でクリック/ドラッグして設定できます
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* 右カラム: 地図 */}
						<div className="space-y-2">
							<Label>地図</Label>
							<Mapbox
								marker={form.watch("coordinates")}
								onMapClick={(coords) =>
									form.setValue("coordinates", coords, { shouldValidate: true })
								}
								onMarkerDrag={(coords) =>
									form.setValue("coordinates", coords, { shouldValidate: true })
								}
								height="300px"
							/>
						</div>
					</div>
				</div>

				{/* 送信ボタン */}
				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/admin/gallery")}
						disabled={
							uploadImage.isPending ||
							updateImage.isPending ||
							(mode === "edit" && isLoadingImage)
						}
					>
						キャンセル
					</Button>
					<Button
						type="submit"
						disabled={
							uploadImage.isPending ||
							updateImage.isPending ||
							(mode === "edit" && isLoadingImage)
						}
					>
						{mode === "edit"
							? updateImage.isPending
								? "更新中..."
								: "更新"
							: uploadImage.isPending
								? "アップロード中..."
								: "作成"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
