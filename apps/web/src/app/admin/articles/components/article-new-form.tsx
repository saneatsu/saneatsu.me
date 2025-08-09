"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCheckSlug, useCreate } from "../../../../entities/article/api";
import { useDebounce } from "../../../../shared/hooks/use-debounce";
import { ArticleMarkdownEditor } from "../../../../shared/ui/article-markdown-editor";
import { Button } from "../../../../shared/ui/button/button";
import { Input } from "../../../../shared/ui/input/input";
import { Label } from "../../../../shared/ui/label/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "../../../../shared/ui/radio-group/radio-group";

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

	/**
	 * フォーム送信処理
	 */
	const onSubmit = async (data: ArticleNewForm) => {
		// スラッグエラーがある場合は送信しない
		if (slugError) {
			alert("スラッグにエラーがあります。修正してから送信してください。");
			return;
		}

		try {
			// 公開日時の処理
			let publishedAt: string | undefined;
			if (data.status === "published" && data.publishedAt) {
				// datetime-localの値をISO文字列に変換
				publishedAt = new Date(data.publishedAt).toISOString();
			}

			// APIに送信
			const response = await createArticleMutation.mutateAsync({
				title: data.title,
				slug: data.slug,
				content: data.content,
				status: data.status,
				publishedAt,
			});

			console.log("記事作成成功:", response);
			alert(`記事「${response.data.title}」が作成されました！`);

			// TODO: 記事一覧ページにリダイレクト
			// router.push("/admin/articles");
		} catch (error) {
			console.error("記事作成エラー:", error);
			const errorMessage =
				error instanceof Error ? error.message : "記事の作成に失敗しました";
			alert(`記事の作成に失敗しました: ${errorMessage}`);
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
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
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
									? "border-blue-300"
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
					<p className="text-sm text-green-600">✓ このスラッグは利用可能です</p>
				)}
				<p className="text-sm text-muted-foreground">
					記事のURLに使用されます（小文字の英数字とハイフンのみ）
				</p>
			</div>

			{/* ステータス */}
			<div className="space-y-2">
				<Label className="required">公開ステータス</Label>
				<RadioGroup
					defaultValue="draft"
					onValueChange={(value) =>
						setValue("status", value as "draft" | "published")
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
				</RadioGroup>
				{errors.status && (
					<p className="text-sm text-destructive">{errors.status.message}</p>
				)}
			</div>

			{/* 公開日時（公開時のみ表示） */}
			{watch("status") === "published" && (
				<div className="space-y-2">
					<Label htmlFor="publishedAt">公開日時</Label>
					<div className="relative">
						<Input
							id="publishedAt"
							type="datetime-local"
							{...register("publishedAt")}
						/>
						<CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
					</div>
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
						preview="live"
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
				<Button type="button" variant="outline">
					キャンセル
				</Button>
				<Button type="submit" disabled={createArticleMutation.isPending}>
					{createArticleMutation.isPending && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					{createArticleMutation.isPending ? "作成中..." : "記事を作成"}
				</Button>
			</div>
		</form>
	);
}
