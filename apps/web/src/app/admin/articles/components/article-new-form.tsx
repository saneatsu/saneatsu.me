"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useDebounce } from "../../../../shared/hooks/use-debounce";
import {
	useCheckSlug,
	useCreate,
	type SuggestionItem,
} from "../../../../entities/article/api";
import {
	ArticleSuggestionsPopover,
} from "../../../../entities/article/ui";
import { Button } from "../../../../shared/ui/button/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";
import { Input } from "../../../../shared/ui/input/input";
import { Label } from "../../../../shared/ui/label/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "../../../../shared/ui/radio-group/radio-group";
import { TagMultiSelect } from "./tag-multi-select";

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
	tagIds: z.array(z.number()).min(1, "最低1つのタグを選択してください"),
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
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionQuery, setSuggestionQuery] = useState("");
	const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
	const editorRef = useRef<HTMLDivElement>(null);

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
			tagIds: [],
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
	const slugError = slugCheckData && !slugCheckData.available 
		? (slugCheckData.message || "このスラッグは既に使用されています") 
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
				tagIds: data.tagIds,
			});

			console.log("記事作成成功:", response);
			alert(`記事「${response.data.title}」が作成されました！`);

			// TODO: 記事一覧ページにリダイレクト
			// router.push("/admin/articles");
		} catch (error) {
			console.error("記事作成エラー:", error);
			const errorMessage = error instanceof Error ? error.message : "記事の作成に失敗しました";
			alert(`記事の作成に失敗しました: ${errorMessage}`);
		}
	};

	/**
	 * Wiki Linkサジェスト選択時の処理
	 */
	const handleSuggestionSelect = (suggestion: SuggestionItem) => {
		// 現在のカーソル位置から[[を検索
		const textarea = editorRef.current?.querySelector('textarea');
		if (!textarea) return;

		const cursorPos = (textarea as HTMLTextAreaElement).selectionStart;
		const beforeCursor = markdownValue.substring(0, cursorPos);
		const afterCursor = markdownValue.substring(cursorPos);

		// [[の開始位置を検索
		const startIndex = beforeCursor.lastIndexOf('[[');
		if (startIndex === -1) return;

		// 新しいコンテンツを構築
		const newContent = 
			markdownValue.substring(0, startIndex) + 
			`[[${suggestion.slug}]]` + 
			afterCursor;

		setMarkdownValue(newContent);
		setValue("content", newContent);
		setShowSuggestions(false);
		setSuggestionQuery("");
	};

	/**
	 * MDEditorの変更処理（Wiki Link検知を含む）
	 */
	const handleEditorChange = (val: string | undefined) => {
		const value = val || "";
		setMarkdownValue(value);
		setValue("content", value);

		// Wiki Link検知
		const textarea = editorRef.current?.querySelector('textarea');
		if (!textarea) return;

		const cursorPos = (textarea as HTMLTextAreaElement).selectionStart;
		const beforeCursor = value.substring(0, cursorPos);

		// [[の検出
		const lastBracketIndex = beforeCursor.lastIndexOf('[[');
		if (lastBracketIndex !== -1) {
			// ]]で閉じられていないか確認
			const afterBracket = value.substring(lastBracketIndex + 2, cursorPos);
			if (!afterBracket.includes(']]')) {
				// サジェストを表示
				setSuggestionQuery(afterBracket);
				setShowSuggestions(true);

				// カーソル位置を取得（簡易実装）
				const rect = textarea.getBoundingClientRect();
				setCursorPosition({
					top: rect.top + 20,
					left: rect.left + 100,
				});
			} else {
				setShowSuggestions(false);
			}
		} else {
			setShowSuggestions(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div className="grid gap-6 lg:grid-cols-2">
				{/* 左カラム: 基本情報 */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>基本情報</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
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
									<p className="text-sm text-destructive">
										{errors.title.message}
									</p>
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
									<p className="text-sm text-destructive">
										{errors.slug.message}
									</p>
								)}
								{slugError && (
									<p className="text-sm text-destructive">{slugError}</p>
								)}
								{!errors.slug &&
									!slugError &&
									debouncedSlug &&
									!slugChecking && (
										<p className="text-sm text-green-600">
											✓ このスラッグは利用可能です
										</p>
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
									<p className="text-sm text-destructive">
										{errors.status.message}
									</p>
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
						</CardContent>
					</Card>

					{/* タグ選択 */}
					<Card>
						<CardHeader>
							<CardTitle>タグ</CardTitle>
						</CardHeader>
						<CardContent>
							<TagMultiSelect
								value={watch("tagIds")}
								onChange={(values) => setValue("tagIds", values)}
								error={errors.tagIds?.message}
								required
							/>
						</CardContent>
					</Card>
				</div>

				{/* 右カラム: 記事内容 */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>記事内容</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<Label htmlFor="content" className="required">
									本文（Markdown形式）
								</Label>
								<div
									ref={editorRef}
									className={
										errors.content ? "border border-destructive rounded-md" : ""
									}
								>
									<MDEditor
										value={markdownValue}
										onChange={handleEditorChange}
										preview="live"
										visibleDragbar={true}
										data-color-mode="light"
										height={500}
									/>
								</div>
								{errors.content && (
									<p className="text-sm text-destructive">
										{errors.content.message}
									</p>
								)}
								<p className="text-sm text-muted-foreground">
									日本語で入力してください。保存時に自動的に他の言語に翻訳されます。Ctrl+Shift+P（Mac:
									Cmd+Shift+P）でプレビューモードを切り替えできます。[[で他の記事へのリンクを挿入できます。
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* 送信ボタン */}
			<div className="flex justify-end space-x-4">
				<Button type="button" variant="outline">
					キャンセル
				</Button>
				<Button type="submit" disabled={createArticleMutation.isPending}>
					{createArticleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{createArticleMutation.isPending ? "作成中..." : "記事を作成"}
				</Button>
			</div>

			{/* Wiki Linkサジェストポップアップ */}
			<ArticleSuggestionsPopover
				open={showSuggestions}
				onOpenChange={setShowSuggestions}
				query={suggestionQuery}
				language="ja"
				onSelect={handleSuggestionSelect}
				position={cursorPosition}
			/>
		</form>
	);
}
