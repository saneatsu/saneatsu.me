"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCheckSlug, useUpdate } from "@/entities/article";
import { useGetAllTags } from "@/entities/tag";
import { CustomMarkdownEditor } from "@/features/article-editor";
import {
	extractGalleryImageIds,
	formatRelativeDate,
	getImageUrl,
	useDebounce,
	useUnsavedChangesAlert,
} from "@/shared/lib";
import type { Option } from "@/shared/ui";
import {
	Alert,
	AlertDescription,
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
	Tabs,
	TabsList,
	TabsTrigger,
	UnsavedChangesDialog,
} from "@/shared/ui";

import { ArticleStatusSelector } from "../article-status-selector/article-status-selector";
import { ArticleThumbnailUploader } from "../article-thumbnail-uploader/article-thumbnail-uploader";

/**
 * 記事編集フォームのスキーマ
 */
const articleEditSchema = z.object({
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
	status: z.enum(["draft", "published", "archived"], {
		message: "ステータスを選択してください",
	}),
	publishedAt: z.string().optional(),
});

type ArticleEditForm = z.infer<typeof articleEditSchema>;

/**
 * 記事編集フォームコンポーネントのプロパティ
 */
interface ArticleEditFormProps {
	/** 編集対象の記事データ */
	article: {
		id: number;
		title: string;
		slug: string;
		content: string;
		status: "draft" | "published" | "archived";
		publishedAt: string | null;
		updatedAt: string | null;
		cfImageId: string | null;
		translations?: {
			ja: {
				title: string | null;
				content: string | null;
			};
			en: {
				title: string | null;
				content: string | null;
			};
		};
		tags: Array<{
			id: number;
			slug: string;
			createdAt: string;
			updatedAt: string;
			articleCount: number;
			translations: {
				ja: string;
				en: string;
			};
		}>;
	};
}

/**
 * 記事編集フォームコンポーネント
 *
 * @description
 * 既存記事を編集するためのフォーム。
 * 初期値として既存の記事データを設定し、
 * 更新時にバックエンドAPIに送信する。
 * 新規作成フォームと同じ高機能MarkdownEditorを使用。
 */
export function ArticleEditForm({ article }: ArticleEditFormProps) {
	const [markdownValue, setMarkdownValue] = useState(article.content);
	const [formError, setFormError] = useState<string>("");
	const [thumbnailError, setThumbnailError] = useState<string>("");
	const [warnings, setWarnings] = useState<
		Array<{ code: string; message: string }>
	>([]);
	const [selectedTags, setSelectedTags] = useState<Option[]>(
		article.tags.map((tag) => ({
			value: String(tag.id),
			label: tag.translations.ja,
		}))
	);
	const [publishedAtDate, setPublishedAtDate] = useState<Date | undefined>(
		article.publishedAt ? new Date(article.publishedAt) : undefined
	);

	// 英語コンテンツを取得（プレビュー表示用）
	const enContent = article.translations?.en.content || "";

	// タイトルの表示言語
	const [titleLanguage, setTitleLanguage] = useState<"ja" | "en">("ja");

	// プレビューの表示言語
	const [previewLanguage, setPreviewLanguage] = useState<"ja" | "en">("ja");

	/**
	 * サムネイルURLを生成
	 *
	 * @description
	 * article.cfImageIdが変更されると自動的に再計算される。
	 * React Queryのキャッシュ無効化により最新のcfImageIdが反映される。
	 */
	const thumbnailUrl = useMemo(() => {
		if (!article.cfImageId) {
			return null;
		}
		return getImageUrl(article.cfImageId, "medium");
	}, [article.cfImageId]);

	/**
	 * 更新日をフォーマット
	 *
	 * @description
	 * 絶対日付と相対日付を組み合わせて表示する。
	 * 例: "2024年1月15日 （3日前）"
	 */
	const formattedUpdatedAt = useMemo(() => {
		if (!article.updatedAt) {
			return "未設定";
		}

		try {
			const updatedDate = new Date(article.updatedAt);

			// 無効な日付の場合
			if (Number.isNaN(updatedDate.getTime())) {
				return "未設定";
			}

			// 絶対日付をフォーマット
			const absoluteDate = updatedDate.toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});

			// 相対日付を取得
			const relativeInfo = formatRelativeDate(article.updatedAt, "ja");

			// 相対日付をテキストに変換
			let relativeText = "";
			if (relativeInfo?.isRelative) {
				if (relativeInfo.minutes !== undefined) {
					relativeText =
						relativeInfo.minutes === 0
							? "たった今"
							: `${relativeInfo.minutes}分前`;
				} else if (relativeInfo.hours !== undefined) {
					relativeText = `${relativeInfo.hours}時間前`;
				} else if (relativeInfo.days !== undefined) {
					relativeText = `${relativeInfo.days}日前`;
				}
			}

			// 絶対日付 (相対日付) の形式で返す
			return relativeText
				? `${absoluteDate} （${relativeText}）`
				: absoluteDate;
		} catch {
			return "未設定";
		}
	}, [article.updatedAt]);

	const form = useForm<ArticleEditForm>({
		resolver: zodResolver(articleEditSchema),
		defaultValues: {
			title: article.title,
			slug: article.slug,
			content: article.content,
			status: article.status,
		},
	});

	/**
	 * フォーム全体のdirty判定
	 *
	 * @description
	 * react-hook-formのisDirtyに加えて、useState管理の値（マークダウン、タグ、公開日時）
	 * も初期値と比較した総合的なdirty判定。
	 */
	const router = useRouter();

	const isAnyFieldDirty = useMemo(() => {
		// マークダウンの変更
		const isContentDirty = markdownValue !== article.content;

		// タグの変更
		const initialTagIds = article.tags
			.map((tag) => String(tag.id))
			.sort()
			.join(",");
		const currentTagIds = selectedTags
			.map((tag) => tag.value)
			.sort()
			.join(",");
		const isTagsDirty = initialTagIds !== currentTagIds;

		// 公開日時の変更
		const initialPublishedAt = article.publishedAt
			? new Date(article.publishedAt).toISOString()
			: undefined;
		const currentPublishedAt = publishedAtDate?.toISOString();
		const isPublishedAtDirty = initialPublishedAt !== currentPublishedAt;

		return (
			form.formState.isDirty ||
			isContentDirty ||
			isTagsDirty ||
			isPublishedAtDirty
		);
	}, [
		form.formState.isDirty,
		markdownValue,
		article.content,
		article.tags,
		article.publishedAt,
		selectedTags,
		publishedAtDate,
	]);

	const { showDialog, handleCancel, handleConfirm, guardNavigation } =
		useUnsavedChangesAlert({
			isDirty: isAnyFieldDirty,
			onNavigate: router.push,
		});

	// 記事更新フック
	const updateMutation = useUpdate();

	// タグ一覧取得フック
	const { data: tagsData, isLoading: tagsLoading } = useGetAllTags();

	// スラッグ重複チェックフック
	const watchSlug = form.watch("slug");
	const debouncedSlug = useDebounce(watchSlug, 500);
	const { data: slugAvailable, isLoading: checkingSlug } = useCheckSlug({
		slug: debouncedSlug || "",
		queryConfig: { enabled: !!debouncedSlug && debouncedSlug !== article.slug },
	});

	// ステータスの監視
	const watchStatus = form.watch("status");

	// Markdown値の変更を監視してフォームに反映
	useEffect(() => {
		form.setValue("content", markdownValue);
	}, [markdownValue, form.setValue]);

	/**
	 * フォーム送信処理
	 */
	const onSubmit = async (data: ArticleEditForm) => {
		try {
			setFormError(""); // エラーメッセージをクリア
			setWarnings([]); // 警告メッセージをクリア

			// publishedAtがある場合、ISO 8601形式に変換
			let publishedAtISO: string | undefined;
			if (publishedAtDate && data.status === "published") {
				// DateオブジェクトをISO形式に変換
				publishedAtISO = publishedAtDate.toISOString();
			}

			// タグIDを抽出
			const tagIds = selectedTags.map((tag) => Number.parseInt(tag.value, 10));

			// ギャラリー画像IDを抽出
			const galleryImageIds = extractGalleryImageIds(data.content);

			await toast.promise(
				updateMutation.mutateAsync({
					id: article.id,
					data: {
						...data,
						publishedAt: publishedAtISO,
						// 常にtagIdsを送信（空配列でも送信）
						tagIds,
						// ギャラリー画像IDを送信
						galleryImageIds:
							galleryImageIds.length > 0
								? galleryImageIds.map((id) =>
										Number.parseInt(id.replace("gallery-", ""), 10)
									)
								: undefined,
					},
				}),
				{
					loading:
						data.status === "draft"
							? "下書きを更新しています..."
							: "記事を更新して翻訳しています...",
					success: (result) => {
						// 警告メッセージがあれば表示
						if (result.warnings && result.warnings.length > 0) {
							setWarnings(result.warnings);
							// 各警告をtoastでも表示
							for (const warning of result.warnings) {
								toast.warning(warning.message);
							}
						}

						// 保存成功後にフォームのdirty状態をリセット
						form.reset(data);

						if (data.status === "draft") {
							return "下書きとして更新されました（翻訳はスキップされました）";
						}
						return "記事が更新されました";
					},
					error: (error) => {
						// 詳細なエラーメッセージを取得
						const errorMessage =
							error instanceof Error
								? error.message
								: "記事の更新に失敗しました";

						// Alertコンポーネント用にエラーを設定
						setFormError(errorMessage);

						// toastに表示するメッセージを返す
						return errorMessage;
					},
				}
			);
		} catch (error) {
			// エラーメッセージを表示（Alert用）
			const errorMessage =
				error instanceof Error
					? error.message
					: "記事の更新中にエラーが発生しました";

			// Alertで表示（Toastは toast.promise() で既に表示済み）
			setFormError(errorMessage);
		}
	};

	/**
	 * MDEditorの変更処理
	 */
	const handleEditorChange = (value: string) => {
		setMarkdownValue(value);
		form.setValue("content", value);
	};

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* フォームエラー表示 */}
					{formError && (
						<Alert variant="destructive" className="max-w-7xl">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>エラーが発生しました</AlertTitle>
							<AlertDescription>{formError}</AlertDescription>
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

					{/* 警告メッセージ表示 */}
					{warnings.length > 0 && (
						<Alert variant="warning" className="max-w-7xl">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>警告</AlertTitle>
							<AlertDescription>
								{warnings.map((warning) => (
									<p key={warning.code}>{warning.message}</p>
								))}
							</AlertDescription>
						</Alert>
					)}

					{/* サムネイル画像 */}
					<div className="max-w-7xl">
						<ArticleThumbnailUploader
							articleId={article.id}
							thumbnailUrl={thumbnailUrl}
							onError={setThumbnailError}
						/>
					</div>

					{/* タイトル */}
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem className="max-w-7xl">
								<div className="flex items-center justify-between">
									<FormLabel required>タイトル</FormLabel>
									<Tabs
										value={titleLanguage}
										onValueChange={(value) =>
											setTitleLanguage(value as "ja" | "en")
										}
									>
										<TabsList className="h-8">
											<TabsTrigger value="ja" className="text-xs">
												日本語
											</TabsTrigger>
											<TabsTrigger value="en" className="text-xs">
												English
											</TabsTrigger>
										</TabsList>
									</Tabs>
								</div>
								{titleLanguage === "ja" ? (
									<FormControl>
										<Input
											key="title-ja"
											placeholder="記事のタイトルを入力"
											{...field}
										/>
									</FormControl>
								) : (
									<Input
										key="title-en"
										value={article.translations?.en?.title ?? "(未設定)"}
										readOnly
										className="bg-muted"
									/>
								)}
								{titleLanguage === "ja" && <FormMessage />}
							</FormItem>
						)}
					/>

					{/* スラッグ */}
					<FormField
						control={form.control}
						name="slug"
						render={({ field }) => (
							<FormItem className="max-w-7xl">
								<FormLabel required>スラッグ</FormLabel>
								<div className="relative">
									<FormControl>
										<Input
											placeholder="article-slug"
											className={
												checkingSlug
													? ""
													: slugAvailable?.available === false &&
															watchSlug !== article.slug
														? "border-destructive"
														: ""
											}
											{...field}
										/>
									</FormControl>
									{checkingSlug && (
										<div className="absolute right-3 top-3">
											<Loader2 className="h-4 w-4 animate-spin" />
										</div>
									)}
								</div>
								<FormMessage />
								{!checkingSlug &&
									slugAvailable?.available === false &&
									watchSlug !== article.slug && (
										<p className="text-sm text-destructive">
											このスラッグは既に使用されています
										</p>
									)}
							</FormItem>
						)}
					/>

					{/* ステータス */}
					<div className="max-w-7xl">
						<ArticleStatusSelector
							value={watchStatus}
							onValueChange={(value) =>
								form.setValue(
									"status",
									value as "draft" | "published" | "archived"
								)
							}
							statuses={["draft", "published", "archived"]}
							label="ステータス"
							required
							error={form.formState.errors.status?.message}
						/>
					</div>

					{/* 公開日時 */}
					{watchStatus === "published" && (
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

					{/* 更新日 */}
					<FormItem className="max-w-7xl">
						<FormLabel>更新日</FormLabel>
						<Input value={formattedUpdatedAt} disabled />
					</FormItem>

					{/* タグ選択 */}
					<FormItem className="max-w-7xl">
						<FormLabel>タグ</FormLabel>
						<MultipleSelector
							value={selectedTags}
							onChange={setSelectedTags}
							options={
								tagsData?.data.map((tag) => ({
									value: String(tag.id),
									label: tag.translations.ja || tag.slug,
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

					{/* 本文エディタ */}
					<FormItem>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<FormLabel required>本文</FormLabel>
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
							<Tabs
								value={previewLanguage}
								onValueChange={(value) =>
									setPreviewLanguage(value as "ja" | "en")
								}
							>
								<TabsList className="h-8">
									<TabsTrigger value="ja" className="text-xs">
										日本語
									</TabsTrigger>
									<TabsTrigger value="en" className="text-xs">
										English
									</TabsTrigger>
								</TabsList>
							</Tabs>
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
								language={previewLanguage}
								enContent={enContent}
							/>
						</div>
						{form.formState.errors.content && (
							<p className="text-sm text-destructive">
								{form.formState.errors.content.message}
							</p>
						)}
						<FormDescription>
							日本語で入力してください。[[で他の記事へのリンクを挿入できます。#でタグを挿入できます。
						</FormDescription>
					</FormItem>

					{/* 送信ボタン */}
					<div className="flex justify-end space-x-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => guardNavigation(() => window.history.back())}
						>
							キャンセル
						</Button>
						<Button
							type="submit"
							disabled={!isAnyFieldDirty || updateMutation.isPending}
						>
							{updateMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									更新中...
								</>
							) : (
								"更新"
							)}
						</Button>
					</div>
				</form>
			</Form>

			{/* 未保存変更アラートダイアログ */}
			<UnsavedChangesDialog
				open={showDialog}
				onCancel={handleCancel}
				onConfirm={handleConfirm}
			/>
		</>
	);
}
