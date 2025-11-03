"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCheckSlug, useUpdate } from "@/entities/article";
import { useGetAllTags } from "@/entities/tag";
import { CustomMarkdownEditor } from "@/features/article-editor";
import { formatRelativeDate, getImageUrl, useDebounce } from "@/shared/lib";
import type { Option } from "@/shared/ui";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	DateTimePicker,
	Input,
	Label,
	MultipleSelector,
	Tabs,
	TabsList,
	TabsTrigger,
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
		title: string | null;
		slug: string;
		content: string | null;
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
	const [markdownValue, setMarkdownValue] = useState(article.content || "");
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

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<ArticleEditForm>({
		resolver: zodResolver(articleEditSchema),
		defaultValues: {
			title: article.title || "",
			slug: article.slug || "",
			content: article.content || "",
			status: article.status,
		},
	});

	// 記事更新フック
	const updateMutation = useUpdate();

	// タグ一覧取得フック
	const { data: tagsData, isLoading: tagsLoading } = useGetAllTags();

	// スラッグ重複チェックフック
	const watchSlug = watch("slug");
	const debouncedSlug = useDebounce(watchSlug, 500);
	const { data: slugAvailable, isLoading: checkingSlug } = useCheckSlug({
		slug: debouncedSlug || "",
		queryConfig: { enabled: !!debouncedSlug && debouncedSlug !== article.slug },
	});

	// ステータスの監視
	const watchStatus = watch("status");

	// Markdown値の変更を監視してフォームに反映
	useEffect(() => {
		setValue("content", markdownValue);
	}, [markdownValue, setValue]);

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

			await toast.promise(
				updateMutation.mutateAsync({
					id: article.id,
					data: {
						...data,
						publishedAt: publishedAtISO,
						// 常にtagIdsを送信（空配列でも送信）
						tagIds,
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

						if (data.status === "draft") {
							return "下書きとして更新されました（翻訳はスキップされました）";
						}
						return "記事が更新されました";
					},
					error: "記事の更新に失敗しました",
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
		setValue("content", value);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
			<div className="space-y-2 max-w-7xl">
				<div className="flex items-center justify-between">
					<Label htmlFor="title">タイトル *</Label>
					<Tabs
						value={titleLanguage}
						onValueChange={(value) => setTitleLanguage(value as "ja" | "en")}
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
					<Input
						key="title-ja"
						id="title"
						{...register("title")}
						placeholder="記事のタイトルを入力"
					/>
				) : (
					<Input
						key="title-en"
						value={article.translations?.en?.title ?? "(未設定)"}
						readOnly
						className="bg-muted"
					/>
				)}
				{titleLanguage === "ja" && errors.title && (
					<p className="text-sm text-destructive">{errors.title.message}</p>
				)}
			</div>

			{/* スラッグ */}
			<div className="space-y-2 max-w-7xl">
				<Label htmlFor="slug">スラッグ *</Label>
				<div className="relative">
					<Input
						id="slug"
						{...register("slug")}
						placeholder="article-slug"
						className={
							checkingSlug
								? ""
								: slugAvailable?.available === false &&
										watchSlug !== article.slug
									? "border-destructive"
									: ""
						}
					/>
					{checkingSlug && (
						<div className="absolute right-3 top-3">
							<Loader2 className="h-4 w-4 animate-spin" />
						</div>
					)}
				</div>
				{errors.slug && (
					<p className="text-sm text-destructive">{errors.slug.message}</p>
				)}
				{!checkingSlug &&
					slugAvailable?.available === false &&
					watchSlug !== article.slug && (
						<p className="text-sm text-destructive">
							このスラッグは既に使用されています
						</p>
					)}
			</div>

			{/* ステータス */}
			<div className="max-w-7xl">
				<ArticleStatusSelector
					value={watchStatus}
					onValueChange={(value) =>
						setValue("status", value as "draft" | "published" | "archived")
					}
					statuses={["draft", "published", "archived"]}
					label="ステータス"
					required
					error={errors.status?.message}
				/>
			</div>

			{/* 公開日時 */}
			{watchStatus === "published" && (
				<div className="space-y-2 max-w-7xl">
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

			{/* 更新日 */}
			<div className="space-y-2 max-w-7xl">
				<Label htmlFor="updatedAt">更新日</Label>
				<Input id="updatedAt" value={formattedUpdatedAt} disabled />
			</div>

			{/* タグ選択 */}
			<div className="space-y-2 max-w-7xl">
				<Label>タグ</Label>
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
				<p className="text-sm text-muted-foreground">
					記事に関連するタグを選択してください
				</p>
			</div>

			{/* 本文エディタ */}
			<div className="space-y-2">
				<Label>本文 *</Label>
				<div
					className={
						errors.content ? "border border-destructive rounded-md" : ""
					}
				>
					<CustomMarkdownEditor
						value={markdownValue}
						onChange={handleEditorChange}
						setValue={setValue as (name: string, value: string) => void}
						height={800}
						language="ja"
						enContent={enContent}
					/>
				</div>
				{errors.content && (
					<p className="text-sm text-destructive">{errors.content.message}</p>
				)}
				<p className="text-sm text-muted-foreground">
					日本語で入力してください。[[で他の記事へのリンクを挿入できます。#でタグを挿入できます。
				</p>
			</div>

			{/* 送信ボタン */}
			<div className="flex gap-4">
				<Button type="submit" disabled={updateMutation.isPending}>
					{updateMutation.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							更新中...
						</>
					) : (
						"記事を更新"
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => window.history.back()}
				>
					キャンセル
				</Button>
			</div>
		</form>
	);
}
