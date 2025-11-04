"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AddressSearch, useUploadGalleryImage } from "@/entities/gallery";
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

/**
 * ギャラリー作成フォームのスキーマ
 */
const galleryFormSchema = z.object({
	/** 画像ファイル */
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
	/** 日本語タイトル */
	titleJa: z.string().optional(),
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
});

type GalleryFormValues = z.infer<typeof galleryFormSchema>;

/**
 * ギャラリー作成フォームコンポーネント
 *
 * @description
 * ギャラリー画像をアップロードするためのフォーム。
 *
 * フィールド:
 * 1. 画像ファイル（必須、最大10MB、JPEG/PNG/GIF/WebP）
 * 2. 日本語タイトル・説明
 * 3. 英語タイトル・説明
 * 4. 撮影日時
 * 5. 位置情報（住所検索、座標入力、地図選択）
 */
export function GalleryForm() {
	const router = useRouter();
	const uploadImage = useUploadGalleryImage();

	// プレビュー画像URL
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// フォーム設定
	const form = useForm<GalleryFormValues>({
		resolver: zodResolver(galleryFormSchema),
		defaultValues: {
			titleJa: "",
			descriptionJa: "",
			coordinates: null,
		},
	});

	/**
	 * ファイル選択ハンドラー
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

		// フォームに設定
		form.setValue("file", file, { shouldValidate: true });
	};

	/**
	 * フォーム送信ハンドラー
	 */
	const onSubmit = async (data: GalleryFormValues) => {
		try {
			// タイトルまたは説明が必須
			if (!data.titleJa && !data.descriptionJa) {
				toast.error("タイトルまたは説明のいずれかを入力してください");
				return;
			}

			await uploadImage.mutateAsync({
				file: data.file,
				titleJa: data.titleJa,
				descriptionJa: data.descriptionJa,
				latitude: data.coordinates?.latitude,
				longitude: data.coordinates?.longitude,
				takenAt: data.takenAt?.toISOString(),
			});

			toast.success("ギャラリー画像をアップロードしました");
			router.push("/admin/gallery");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "ギャラリー画像のアップロードに失敗しました"
			);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				{/* 画像ファイル */}
				<FormField
					control={form.control}
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
								<FormLabel>タイトル</FormLabel>
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
						disabled={uploadImage.isPending}
					>
						キャンセル
					</Button>
					<Button type="submit" disabled={uploadImage.isPending}>
						{uploadImage.isPending ? "アップロード中..." : "作成"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
