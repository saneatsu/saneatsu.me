"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
	useCheckSlug,
	useCreate,
	useDeleteImage,
	useUploadImage,
} from "@/entities/article";
import { useGetAllTags } from "@/entities/tag";
import { CustomMarkdownEditor } from "@/features/article-editor";
import {
	extractGalleryImageIds,
	useDebounce,
	useUnsavedChangesAlert,
} from "@/shared/lib";
import {
	Alert,
	AlertDescription,
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertTitle,
	Button,
	DateTimePicker,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	MultipleSelector,
	type Option,
	UnsavedChangesDialog,
} from "@/shared/ui";

import { ArticleStatusSelector } from "../article-status-selector/article-status-selector";
import { ArticleThumbnailUploader } from "../article-thumbnail-uploader/article-thumbnail-uploader";

/**
 * 記事作成フォームのスキーマ
 */
const articleNewSchema = z.object({
	title: z
		.string()
		.min(1, "タイトルは必須です")
		.max(200, "タイトルは200文字以内で入力してください"),
	slug: z
		.string()
		.min(1, "スラッグは必須です")
		.max(100, "スラッグは100文字以内で入力してください")
		.regex(
			/^[a-z0-9-]+$/,
			"スラッグは小文字の英数字とハイフンのみ使用できます"
		),
	content: z.string().min(1, "本文は必須です"),
	status: z.enum(["draft", "published"], {
		message: "ステータスを選択してください",
	}),
	publishedAt: z.string().optional(),
	tagIds: z.array(z.number()).optional(),
});

type ArticleNewForm = z.infer<typeof articleNewSchema>;

/**
 * 記事新規作成フォームコンポーネント
 *
 * @description
 * 記事を作成するためのフォーム。
 * 入力されたデータはバックエンドAPIに送信され、
 * 自動翻訳を実行して多言語記事として保存される。
 */
export function ArticleNewForm() {
	const [markdownValue, setMarkdownValue] = useState("");
	const [showSlugErrorDialog, setShowSlugErrorDialog] = useState(false);
	const [selectedTags, setSelectedTags] = useState<Option[]>([]);
	const [publishedAtDate, setPublishedAtDate] = useState<Date | undefined>();
	const [thumbnailError, setThumbnailError] = useState<string>("");
	const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
	const [validationError, setValidationError] = useState<string>("");
	const router = useRouter();

	const form = useForm<ArticleNewForm>({
		resolver: zodResolver(articleNewSchema),
		defaultValues: {
			status: "draft",
		},
	});

	/**
	 * フォーム全体のdirty判定
	 *
	 * @description
	 * react-hook-formのisDirtyに加えて、useState管理の値（マークダウン、タグ、公開日時、サムネイル）
	 * も考慮した総合的なdirty判定。いずれかに入力があればdirtyとみなす。
	 */
	const isAnyFieldDirty = useMemo(() => {
		return (
			form.formState.isDirty ||
			markdownValue !== "" ||
			selectedTags.length > 0 ||
			publishedAtDate !== undefined ||
			thumbnailFile !== null
		);
	}, [
		form.formState.isDirty,
		markdownValue,
		selectedTags,
		publishedAtDate,
		thumbnailFile,
	]);

	const { showDialog, handleCancel, handleConfirm, guardNavigation } =
		useUnsavedChangesAlert({
			isDirty: isAnyFieldDirty,
			onNavigate: router.push,
		});

	// スラッグの値を監視
	const slugValue = form.watch("slug");

	// スラッグをデバウンス（500ms遅延）
	const debouncedSlug = useDebounce(slugValue, 500);

	// 記事作成フック
	const createArticleMutation = useCreate();

	// 画像アップロードフック
	const uploadImageMutation = useUploadImage();

	// 画像削除フック
	const deleteImageMutation = useDeleteImage();

	// タグ一覧取得フック
	const { data: tagsData, isLoading: tagsLoading } = useGetAllTags();

	// スラッグ重複チェックフック
	const { data: slugCheckData, isLoading: slugChecking } = useCheckSlug({
		slug: debouncedSlug || "",
		queryConfig: {
			enabled: !!debouncedSlug && debouncedSlug.length > 0,
		},
	});

	// スラッグエラーの判定
	const slugError =
		slugCheckData && !slugCheckData.available
			? slugCheckData.message || "このスラッグは既に使用されています"
			: null;

	// ステータスの監視
	const watchStatus = form.watch("status");

	/**
	 * フォーム送信処理
	 *
	 * @description
	 * 1. スラッグエラーチェック
	 * 2. サムネイル画像がある場合、先にアップロード
	 * 3. 記事を作成（画像IDを含む）
	 * 4. 記事作成失敗時は、アップロードした画像を削除
	 * 5. 成功したらリダイレクト
	 */
	const onSubmit = async (data: ArticleNewForm) => {
		// スラッグエラーがある場合は送信しない
		if (slugError) {
			setShowSlugErrorDialog(true);
			return;
		}

		// アップロード済み画像のIDを保持（エラー時の削除用）
		let uploadedImageId: string | undefined;

		try {
			// 1. サムネイル画像がある場合、先にアップロード
			if (thumbnailFile) {
				await toast.promise(
					uploadImageMutation.mutateAsync({
						file: thumbnailFile,
					}),
					{
						loading: "画像をアップロードしています...",
						success: (result) => {
							console.log("画像アップロード成功:", result.imageId);
							uploadedImageId = result.imageId;
							// 成功メッセージは表示せず、次の処理に進む
							return "";
						},
						error: (err) => {
							console.error("画像アップロードエラー:", err);
							const errorMessage =
								err && typeof err === "object" && "error" in err
									? (err.error as { message: string }).message
									: "サムネイル画像のアップロードに失敗しました";
							return errorMessage;
						},
					}
				);
			}

			// 2. 公開日時の処理
			let publishedAt: string | undefined;
			if (data.status === "published" && publishedAtDate) {
				// DateオブジェクトをISO文字列に変換
				publishedAt = publishedAtDate.toISOString();
			}

			// 3. タグIDを抽出
			const tagIds = selectedTags.map((tag) => Number.parseInt(tag.value, 10));

			// 3.1. ギャラリー画像IDを抽出
			const galleryImageIds = extractGalleryImageIds(data.content);

			// 4. 記事を作成（cfImageIdを含む）
			await toast.promise(
				createArticleMutation.mutateAsync({
					title: data.title,
					slug: data.slug,
					content: data.content,
					status: data.status,
					publishedAt,
					tagIds: tagIds.length > 0 ? tagIds : undefined,
					galleryImageIds:
						galleryImageIds.length > 0
							? galleryImageIds.map((id) =>
									Number.parseInt(id.replace("gallery-", ""), 10)
								)
							: undefined,
					cfImageId: uploadedImageId,
				}),
				{
					loading:
						data.status === "draft"
							? "下書きを保存しています..."
							: "記事を保存して翻訳しています...",
					success: (result) => {
						console.log("記事作成成功:", result);
						if (result.data.status === "draft") {
							return "下書きとして保存されました（翻訳はスキップされました）";
						}
						return `記事「${result.data.title}」が作成され、英語に翻訳されました`;
					},
					error: "記事の作成に失敗しました",
				}
			);

			router.push("/admin/articles");
		} catch (error) {
			console.error("記事作成エラー:", error);

			// 5. 記事作成失敗時、アップロード済み画像を削除
			if (uploadedImageId) {
				try {
					await deleteImageMutation.mutateAsync({ imageId: uploadedImageId });
					console.log("アップロードした画像を削除しました:", uploadedImageId);
					toast.info("アップロードした画像を削除しました");
				} catch (deleteError) {
					console.error("画像削除エラー:", deleteError);
					// 画像削除失敗は致命的ではないため、警告のみ
				}
			}

			// エラーメッセージを表示（Alert用）
			const errorMessage =
				error instanceof Error ? error.message : "記事の作成に失敗しました";

			// Alertで表示（Toastは toast.promise() で既に表示済み）
			setValidationError(errorMessage);
		}
	};

	/**
	 * MDEditorの変更処理
	 */
	const handleEditorChange = (val: string) => {
		setMarkdownValue(val);
		form.setValue("content", val);
	};

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					{/* バリデーションエラー表示 */}
					{validationError && (
						<Alert variant="destructive" className="max-w-7xl">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>エラーが発生しました</AlertTitle>
							<AlertDescription>{validationError}</AlertDescription>
						</Alert>
					)}

					{/* サムネイルエラー表示 */}
					{thumbnailError && (
						<Alert variant="destructive" className="max-w-7xl">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>サムネイル画像エラー</AlertTitle>
							<AlertDescription>{thumbnailError}</AlertDescription>
						</Alert>
					)}

					{/* サムネイル画像 */}
					<div className="max-w-7xl">
						<ArticleThumbnailUploader
							mode="create"
							onFileSelect={setThumbnailFile}
							onError={setThumbnailError}
						/>
					</div>

					{/* タイトル */}
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem className="max-w-7xl">
								<FormLabel required>タイトル</FormLabel>
								<FormControl>
									<Input
										placeholder="記事のタイトルを入力してください"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* スラッグ */}
					<FormField
						control={form.control}
						name="slug"
						render={({ field }) => (
							<FormItem className="max-w-7xl">
								<FormLabel required>
									スラッグ
									{slugChecking && (
										<span className="ml-2 text-sm text-muted-foreground">
											確認中...
										</span>
									)}
								</FormLabel>
								<div className="relative">
									<FormControl>
										<Input
											placeholder="url-friendly-slug"
											className={
												slugError
													? "border-destructive"
													: slugChecking
														? "border-primary/30"
														: ""
											}
											{...field}
										/>
									</FormControl>
									{slugChecking && (
										<Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
									)}
								</div>
								<FormMessage />
								{slugError && (
									<p className="text-sm text-destructive">{slugError}</p>
								)}
								{!form.formState.errors.slug &&
									!slugError &&
									debouncedSlug &&
									!slugChecking && (
										<p className="text-sm text-emerald-600">
											✓ このスラッグは利用可能です
										</p>
									)}
								<FormDescription>
									記事のURLに使用されます（小文字の英数字とハイフンのみ）
								</FormDescription>
							</FormItem>
						)}
					/>

					{/* ステータス */}
					<div className="max-w-7xl">
						<ArticleStatusSelector
							value={watchStatus}
							onValueChange={(value) =>
								form.setValue("status", value as "draft" | "published")
							}
							statuses={["draft", "published"]}
							label="公開ステータス"
							required
							error={form.formState.errors.status?.message}
						/>
					</div>

					{/* タグ選択 */}
					<FormItem className="max-w-7xl">
						<FormLabel>タグ</FormLabel>
						<MultipleSelector
							value={selectedTags}
							onChange={setSelectedTags}
							options={
								tagsData?.data.map((tag) => ({
									value: String(tag.id),
									label: tag.translations.ja || tag.slug, // FIXME:
								})) || []
							}
							placeholder="タグを選択してください"
							emptyIndicator={
								<p className="text-center text-sm text-muted-foreground">
									{tagsLoading ? "読み込み中..." : "タグが見つかりません"}
								</p>
							}
							disabled={tagsLoading}
						/>
						<FormDescription>
							記事に関連するタグを選択してください
						</FormDescription>
					</FormItem>

					{/* 公開日時（公開時のみ表示） */}
					{form.watch("status") === "published" && (
						<FormItem className="max-w-7xl">
							<FormLabel>公開日時</FormLabel>
							<DateTimePicker
								value={publishedAtDate}
								onChange={setPublishedAtDate}
								placeholder="公開日時を選択してください"
							/>
							<FormDescription>
								空欄の場合は現在時刻が設定されます
							</FormDescription>
						</FormItem>
					)}

					{/* 記事内容 */}
					<FormItem>
						<div className="flex items-center justify-between">
							<FormLabel required>本文（Markdown形式）</FormLabel>
							<a
								href="/admin/markdown-guide"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Markdown記法
								<ExternalLink className="h-3.5 w-3.5" />
							</a>
						</div>
						<div
							className={
								form.formState.errors.content
									? "border border-destructive rounded-md"
									: ""
							}
						>
							<CustomMarkdownEditor
								value={markdownValue}
								onChange={handleEditorChange}
								setValue={
									form.setValue as (name: string, value: string) => void
								}
								height={800}
								language="ja"
							/>
						</div>
						{form.formState.errors.content && (
							<p className="text-sm text-destructive">
								{form.formState.errors.content.message}
							</p>
						)}
						<FormDescription>
							日本語で入力してください。保存時に自動的に他の言語に翻訳されます。Ctrl+Shift+P（Mac:
							Cmd+Shift+P）でプレビューモードを切り替えできます。[[で他の記事へのリンクを挿入できます。
						</FormDescription>
					</FormItem>

					{/* 送信ボタン */}
					<div className="flex justify-end space-x-4">
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								guardNavigation(() => router.push("/admin/articles"))
							}
						>
							キャンセル
						</Button>
						<Button
							type="submit"
							disabled={
								createArticleMutation.isPending || uploadImageMutation.isPending
							}
						>
							{(createArticleMutation.isPending ||
								uploadImageMutation.isPending) && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{uploadImageMutation.isPending
								? "画像アップロード中..."
								: createArticleMutation.isPending
									? "作成中..."
									: "作成"}
						</Button>
					</div>
				</form>
			</Form>

			{/* スラッグエラーダイアログ */}
			<AlertDialog
				open={showSlugErrorDialog}
				onOpenChange={setShowSlugErrorDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>スラッグエラー</AlertDialogTitle>
						<AlertDialogDescription>
							スラッグにエラーがあります。修正してから送信してください。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowSlugErrorDialog(false)}>
							OK
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* 未保存変更アラートダイアログ */}
			<UnsavedChangesDialog
				open={showDialog}
				onCancel={handleCancel}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
