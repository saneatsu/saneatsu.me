"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { ArticleMarkdownEditor } from "@/features/article-editor";
import { useDebounce } from "@/shared/lib";
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
	Input,
	Label,
	MultipleSelector,
	type Option,
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

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<ArticleNewForm>({
		resolver: zodResolver(articleNewSchema),
		defaultValues: {
			status: "draft",
		},
	});

	// スラッグの値を監視
	const slugValue = watch("slug");

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
	const watchStatus = watch("status");

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
				try {
					const uploadResult = await uploadImageMutation.mutateAsync({
						file: thumbnailFile,
					});
					uploadedImageId = uploadResult.imageId;
					console.log("画像アップロード成功:", uploadedImageId);
				} catch (uploadError) {
					console.error("画像アップロードエラー:", uploadError);
					const errorMessage =
						uploadError &&
						typeof uploadError === "object" &&
						"error" in uploadError
							? (uploadError.error as { message: string }).message
							: "サムネイル画像のアップロードに失敗しました";
					toast.error(errorMessage);
					// 画像アップロード失敗時は処理を中止
					return;
				}
			}

			// 2. 公開日時の処理
			let publishedAt: string | undefined;
			if (data.status === "published" && publishedAtDate) {
				// DateオブジェクトをISO文字列に変換
				publishedAt = publishedAtDate.toISOString();
			}

			// 3. タグIDを抽出
			const tagIds = selectedTags.map((tag) => Number.parseInt(tag.value));

			// 4. 記事を作成（cfImageIdを含む）
			const response = await createArticleMutation.mutateAsync({
				title: data.title,
				slug: data.slug,
				content: data.content,
				status: data.status,
				publishedAt,
				tagIds: tagIds.length > 0 ? tagIds : undefined,
				cfImageId: uploadedImageId,
			});

			console.log("記事作成成功:", response);
			toast.success(`記事「${response.data.title}」が作成されました！`);

			// 記事一覧ページにリダイレクト
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

			// エラーメッセージを表示
			const errorMessage =
				error instanceof Error ? error.message : "記事の作成に失敗しました";

			// Alert と toast の両方で表示
			setValidationError(errorMessage);
			toast.error(errorMessage);
		}
	};

	/**
	 * MDEditorの変更処理
	 */
	const handleEditorChange = (val: string) => {
		setMarkdownValue(val);
		setValue("content", val);
	};

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
				{/* バリデーションエラー表示 */}
				{validationError && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>エラーが発生しました</AlertTitle>
						<AlertDescription>{validationError}</AlertDescription>
					</Alert>
				)}

				{/* サムネイルエラー表示 */}
				{thumbnailError && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>サムネイル画像エラー</AlertTitle>
						<AlertDescription>{thumbnailError}</AlertDescription>
					</Alert>
				)}

				{/* サムネイル画像 */}
				<ArticleThumbnailUploader
					mode="create"
					onFileSelect={setThumbnailFile}
					onError={setThumbnailError}
				/>

				{/* タイトル */}
				<div className="space-y-2">
					<Label htmlFor="title" className="required">
						タイトル
					</Label>
					<Input
						id="title"
						{...register("title")}
						placeholder="記事のタイトルを入力してください"
						className={errors.title ? "border-destructive" : ""}
					/>
					{errors.title && (
						<p className="text-sm text-destructive">{errors.title.message}</p>
					)}
				</div>

				{/* スラッグ */}
				<div className="space-y-2">
					<Label htmlFor="slug" className="required">
						スラッグ
						{slugChecking && (
							<span className="ml-2 text-sm text-muted-foreground">
								確認中...
							</span>
						)}
					</Label>
					<div className="relative">
						<Input
							id="slug"
							{...register("slug")}
							placeholder="url-friendly-slug"
							className={
								errors.slug || slugError
									? "border-destructive"
									: slugChecking
										? "border-primary/30"
										: ""
							}
						/>
						{slugChecking && (
							<Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
						)}
					</div>
					{errors.slug && (
						<p className="text-sm text-destructive">{errors.slug.message}</p>
					)}
					{slugError && <p className="text-sm text-destructive">{slugError}</p>}
					{!errors.slug && !slugError && debouncedSlug && !slugChecking && (
						<p className="text-sm text-emerald-600">
							✓ このスラッグは利用可能です
						</p>
					)}
					<p className="text-sm text-muted-foreground">
						記事のURLに使用されます（小文字の英数字とハイフンのみ）
					</p>
				</div>

				{/* ステータス */}
				<ArticleStatusSelector
					value={watchStatus}
					onValueChange={(value) =>
						setValue("status", value as "draft" | "published")
					}
					statuses={["draft", "published"]}
					label="公開ステータス"
					required
					error={errors.status?.message}
				/>

				{/* タグ選択 */}
				<div className="space-y-2">
					<Label htmlFor="tags">タグ</Label>
					<MultipleSelector
						value={selectedTags}
						onChange={setSelectedTags}
						options={
							tagsData?.data.map((tag) => ({
								value: String(tag.id),
								label: tag.translations.ja,
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
					<p className="text-sm text-muted-foreground">
						記事に関連するタグを選択してください
					</p>
				</div>

				{/* 公開日時（公開時のみ表示） */}
				{watch("status") === "published" && (
					<div className="space-y-2">
						<Label htmlFor="publishedAt">公開日時</Label>
						<DateTimePicker
							value={publishedAtDate}
							onChange={setPublishedAtDate}
							placeholder="公開日時を選択してください"
						/>
						<p className="text-sm text-muted-foreground">
							空欄の場合は現在時刻が設定されます
						</p>
					</div>
				)}

				{/* 記事内容 */}
				<div className="space-y-2">
					<Label htmlFor="content" className="required">
						本文（Markdown形式）
					</Label>
					<div
						className={
							errors.content ? "border border-destructive rounded-md" : ""
						}
					>
						<ArticleMarkdownEditor
							value={markdownValue}
							onChange={handleEditorChange}
							setValue={setValue as (name: string, value: string) => void}
							height={500}
							language="ja"
						/>
					</div>
					{errors.content && (
						<p className="text-sm text-destructive">{errors.content.message}</p>
					)}
					<p className="text-sm text-muted-foreground">
						日本語で入力してください。保存時に自動的に他の言語に翻訳されます。Ctrl+Shift+P（Mac:
						Cmd+Shift+P）でプレビューモードを切り替えできます。[[で他の記事へのリンクを挿入できます。
					</p>
				</div>

				{/* 送信ボタン */}
				<div className="flex justify-end space-x-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/admin/articles")}
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
								: "記事を作成"}
					</Button>
				</div>
			</form>

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
		</>
	);
}
