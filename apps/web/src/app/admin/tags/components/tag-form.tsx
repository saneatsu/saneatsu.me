"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCheckTagSlug, type CreateTagInput } from "../../../../entities/tag";
import { useDebounce } from "../../../../shared/hooks/use-debounce";
import { Button } from "../../../../shared/ui/button/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../../shared/ui/form/form";
import { Input } from "../../../../shared/ui/input/input";

/**
 * タグフォームのバリデーションスキーマ
 */
const tagFormSchema = z.object({
	slug: z
		.string()
		.min(1, "スラッグは必須です")
		.max(50, "スラッグは50文字以内で入力してください")
		.regex(
			/^[a-z0-9-]+$/,
			"スラッグは英小文字、数字、ハイフンのみ使用できます"
		),
	nameJa: z
		.string()
		.min(1, "日本語名は必須です")
		.max(50, "日本語名は50文字以内で入力してください"),
	nameEn: z
		.string()
		.min(1, "英語名は必須です")
		.max(50, "英語名は50文字以内で入力してください"),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

/**
 * タグフォームコンポーネントのプロパティ
 */
interface TagFormProps {
	/** 初期値 */
	initialValues?: Partial<TagFormValues>;
	/** 送信時の処理 */
	onSubmit: (data: CreateTagInput) => void;
	/** 送信中かどうか */
	isSubmitting?: boolean;
	/** キャンセル時の処理 */
	onCancel?: () => void;
}

/**
 * タグフォームコンポーネント
 * 
 * タグの作成・編集で共通で使用するフォーム
 */
export function TagForm({
	initialValues,
	onSubmit,
	isSubmitting = false,
	onCancel,
}: TagFormProps) {
	const form = useForm<TagFormValues>({
		resolver: zodResolver(tagFormSchema),
		defaultValues: {
			slug: initialValues?.slug || "",
			nameJa: initialValues?.nameJa || "",
			nameEn: initialValues?.nameEn || "",
		},
	});

	// スラッグの値を監視（デバウンス付き）
	const slug = form.watch("slug");
	const debouncedSlug = useDebounce(slug, 500);

	// スラッグ重複チェック
	const { data: slugCheckResult, isLoading: isCheckingSlug } = useCheckTagSlug({
		slug: debouncedSlug,
		queryConfig: {
			// 編集時は自分のスラッグはチェックしない
			enabled: debouncedSlug.length > 0 && debouncedSlug !== initialValues?.slug,
		},
	});

	// スラッグ重複エラーの設定
	useEffect(() => {
		if (slugCheckResult && !slugCheckResult.available) {
			form.setError("slug", {
				type: "manual",
				message: "このスラッグは既に使用されています",
			});
		}
	}, [slugCheckResult, form]);

	/**
	 * フォーム送信処理
	 */
	const handleSubmit = form.handleSubmit((data) => {
		// CreateTagInput形式に変換
		const input: CreateTagInput = {
			slug: data.slug,
			translations: [
				{
					name: data.nameJa,
					language: "ja",
				},
				{
					name: data.nameEn,
					language: "en",
				},
			],
		};

		onSubmit(input);
	});

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* スラッグ入力 */}
				<FormField
					control={form.control}
					name="slug"
					render={({ field }) => (
						<FormItem>
							<FormLabel>スラッグ</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										{...field}
										placeholder="javascript"
										className="pr-10"
										disabled={isSubmitting}
									/>
									{isCheckingSlug && (
										<div className="absolute right-3 top-1/2 -translate-y-1/2">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										</div>
									)}
								</div>
							</FormControl>
							<FormDescription>
								URLで使用される識別子です。英小文字、数字、ハイフンのみ使用できます。
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 日本語名入力 */}
				<FormField
					control={form.control}
					name="nameJa"
					render={({ field }) => (
						<FormItem>
							<FormLabel>日本語名</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="JavaScript"
									disabled={isSubmitting}
								/>
							</FormControl>
							<FormDescription>
								日本語ページで表示されるタグ名です。
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 英語名入力 */}
				<FormField
					control={form.control}
					name="nameEn"
					render={({ field }) => (
						<FormItem>
							<FormLabel>英語名</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="JavaScript"
									disabled={isSubmitting}
								/>
							</FormControl>
							<FormDescription>
								英語ページで表示されるタグ名です。
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* アクションボタン */}
				<div className="flex gap-4">
					<Button
						type="submit"
						disabled={isSubmitting || (slugCheckResult && !slugCheckResult.available)}
					>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{initialValues ? "更新" : "作成"}
					</Button>
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							キャンセル
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}