"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCheckSlug, useUpdate } from "@/entities/article";
import { ArticleMarkdownEditor } from "@/features/article-editor";
import { useDebounce } from "@/shared/lib";
import {
	Badge,
	Button,
	Input,
	Label,
	RadioGroup,
	RadioGroupItem,
} from "@/shared/ui";

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
		status: string;
		publishedAt: string | null;
		tags: Array<{ id: number; slug: string; name: string | null }>;
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
			status: article.status as "draft" | "published" | "archived",
			publishedAt: article.publishedAt || undefined,
		},
	});

	// 記事更新フック
	const updateMutation = useUpdate();

	// スラッグ重複チェックフック
	const watchSlug = watch("slug");
	const debouncedSlug = useDebounce(watchSlug, 500);
	const { data: slugAvailable, isLoading: checkingSlug } = useCheckSlug({
		slug: debouncedSlug || "",
		queryConfig: { enabled: !!debouncedSlug && debouncedSlug !== article.slug },
	});

	// タグIDの状態管理
	const [selectedTagIds] = useState<number[]>(
		article.tags.map((tag) => tag.id)
	);

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

			// publishedAtがある場合、ISO 8601形式に変換
			let publishedAtISO: string | undefined = data.publishedAt;
			if (data.publishedAt && data.status === "published") {
				// datetime-local形式(YYYY-MM-DDTHH:mm)をISO形式に変換
				publishedAtISO = new Date(data.publishedAt).toISOString();
			}

			await updateMutation.mutateAsync({
				id: article.id,
				data: {
					...data,
					publishedAt: publishedAtISO,
					// 常にtagIdsを送信（空配列でも送信）
					tagIds: selectedTagIds,
				},
			});
		} catch (error) {
			// エラーメッセージをフォーム上部に表示
			if (error instanceof Error) {
				setFormError(error.message);
			} else {
				setFormError("記事の更新中にエラーが発生しました");
			}
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
			{/* エラーメッセージ */}
			{formError && (
				<div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
					<p className="text-sm text-destructive font-medium">
						エラーが発生しました
					</p>
					<p className="text-sm text-destructive mt-1">{formError}</p>
				</div>
			)}

			{/* タイトル */}
			<div className="space-y-2">
				<Label htmlFor="title">タイトル *</Label>
				<Input
					id="title"
					{...register("title")}
					placeholder="記事のタイトルを入力"
				/>
				{errors.title && (
					<p className="text-sm text-destructive">{errors.title.message}</p>
				)}
			</div>

			{/* スラッグ */}
			<div className="space-y-2">
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
			<div className="space-y-2">
				<Label>ステータス *</Label>
				<RadioGroup
					value={watchStatus}
					onValueChange={(value) =>
						setValue("status", value as "draft" | "published" | "archived")
					}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="draft" id="draft" />
						<Label htmlFor="draft">下書き</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="published" id="published" />
						<Label htmlFor="published">公開</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="archived" id="archived" />
						<Label htmlFor="archived">アーカイブ</Label>
					</div>
				</RadioGroup>
				{errors.status && (
					<p className="text-sm text-destructive">{errors.status.message}</p>
				)}
			</div>

			{/* 公開日時 */}
			{watchStatus === "published" && (
				<div className="space-y-2">
					<Label htmlFor="publishedAt">公開日時</Label>
					<div className="relative">
						<Input
							id="publishedAt"
							type="datetime-local"
							{...register("publishedAt")}
						/>
						<CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
					</div>
					<p className="text-sm text-muted-foreground">
						空欄の場合は現在時刻が設定されます
					</p>
				</div>
			)}

			{/* タグ選択 */}
			<div className="space-y-2">
				<Label>タグ * (最低1つ、最大10個)</Label>
				<div className="flex flex-wrap gap-2">
					{article.tags.length > 0 ? (
						article.tags.map((tag) => (
							<Badge key={tag.id} variant="secondary">
								{tag.slug}
							</Badge>
						))
					) : (
						<p className="text-sm text-muted-foreground">
							タグが選択されていません
						</p>
					)}
				</div>
				<p className="text-sm text-muted-foreground">
					※ タグ編集機能は現在開発中です。本文内で#タグを使用してください。
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
					<ArticleMarkdownEditor
						value={markdownValue}
						onChange={handleEditorChange}
						setValue={setValue as (name: string, value: string) => void}
						height={600}
						preview="edit"
						language="ja"
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
