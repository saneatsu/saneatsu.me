"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor, { commands, type ICommand } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	type SuggestionItem,
	useCheckSlug,
	useCreate,
} from "../../../../entities/article/api";
import { ArticleSuggestionsPopover } from "../../../../entities/article/ui";
import { useDebounce } from "../../../../shared/hooks/use-debounce";
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
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionQuery, setSuggestionQuery] = useState("");
	const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
	const editorRef = useRef<HTMLDivElement>(null);

	// サジェストクエリを300msでデバウンス
	const debouncedSuggestionQuery = useDebounce(suggestionQuery, 300);

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

	// カスタムhrコマンド（Ctrl+Hを無効化）
	const customHr: ICommand = {
		...commands.hr,
		execute: () => {
			// 何もしない（デフォルトのhr挿入を防ぐ）
		},
	};

	// Ctrl+HでBackspace処理を実行
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl+H または Cmd+H を検知
			if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
				const textarea = document.querySelector(
					".w-md-editor-text-input"
				) as HTMLTextAreaElement;
				if (!textarea || document.activeElement !== textarea) return;

				e.preventDefault();
				e.stopPropagation();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				if (start === end && start > 0) {
					// カーソル位置の前の文字を削除
					const newValue = value.slice(0, start - 1) + value.slice(start);

					// 値を更新
					setMarkdownValue(newValue);
					setValue("content", newValue);

					// textareaの値も更新してカーソル位置を設定
					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start - 1, start - 1);
						textarea.focus();
					}, 0);
				} else if (start !== end) {
					// 選択範囲を削除
					const newValue = value.slice(0, start) + value.slice(end);

					// 値を更新
					setMarkdownValue(newValue);
					setValue("content", newValue);

					// textareaの値も更新してカーソル位置を設定
					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start, start);
						textarea.focus();
					}, 0);
				}
			}
		};

		// キャプチャフェーズで処理
		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [setValue, setMarkdownValue]);

	// カスタムコマンドリスト（hrを置き換え）
	const customCommands = [
		commands.bold,
		commands.italic,
		commands.strikethrough,
		commands.code,
		commands.link,
		commands.quote,
		commands.codeBlock,
		commands.comment,
		commands.image,
		commands.table,
		customHr, // カスタムhrコマンドを使用
		commands.checkedListCommand,
		commands.orderedListCommand,
		commands.unorderedListCommand,
	];

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
	 * Wiki Linkサジェスト選択時の処理
	 */
	const handleSuggestionSelect = (suggestion: SuggestionItem) => {
		// 現在のカーソル位置から[[を検索
		const textarea = editorRef.current?.querySelector(
			"textarea"
		) as HTMLTextAreaElement;
		if (!textarea) return;

		const cursorPos = textarea.selectionStart;
		const beforeCursor = markdownValue.substring(0, cursorPos);
		const afterCursor = markdownValue.substring(cursorPos);

		// [[の開始位置を検索
		const startIndex = beforeCursor.lastIndexOf("[[");
		if (startIndex === -1) return;

		// 新しいコンテンツを構築
		const newContent =
			markdownValue.substring(0, startIndex) +
			`[[${suggestion.slug}]]` +
			afterCursor;

		// 新しいカーソル位置を計算
		const newCursorPos = startIndex + `[[${suggestion.slug}]]`.length;

		setMarkdownValue(newContent);
		setValue("content", newContent);
		setShowSuggestions(false);
		setSuggestionQuery("");

		// フォーカスをMDEditorのテキストエリアに戻す
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	/**
	 * MDEditorの変更処理（Wiki Link検知を含む）
	 */
	const handleEditorChange = (val: string | undefined) => {
		const value = val || "";
		setMarkdownValue(value);
		setValue("content", value);

		// Wiki Link検知
		const textarea = editorRef.current?.querySelector("textarea");
		if (!textarea) return;

		const cursorPos = (textarea as HTMLTextAreaElement).selectionStart;
		const beforeCursor = value.substring(0, cursorPos);

		// [[の検出
		const lastBracketIndex = beforeCursor.lastIndexOf("[[");
		if (lastBracketIndex !== -1) {
			// ]]で閉じられていないか確認
			const afterBracket = value.substring(lastBracketIndex + 2, cursorPos);
			if (!afterBracket.includes("]]")) {
				// サジェストを表示
				setSuggestionQuery(afterBracket);
				setShowSuggestions(true);

				// カーソル位置を取得
				const textarea = editorRef.current?.querySelector("textarea");
				if (textarea) {
					// テキストエリアのスタイル情報を取得
					const styles = window.getComputedStyle(textarea);
					const lineHeight = parseInt(styles.lineHeight) || 20;

					// カーソル位置を推定（簡易版）
					// TODO: より正確な位置計算が必要な場合は getCaretCoordinates ライブラリを使用
					const rect = textarea.getBoundingClientRect();
					const textBeforeCursor = value.substring(0, cursorPos);
					const lines = textBeforeCursor.split("\n").length;

					// [[の位置を基準に計算
					const lastLineStart = textBeforeCursor.lastIndexOf("\n") + 1;
					const currentLineText = textBeforeCursor.substring(lastLineStart);
					const bracketPosInLine = currentLineText.lastIndexOf("[[");

					setCursorPosition({
						top: rect.top + lines * lineHeight,
						left: rect.left + bracketPosInLine * 8, // 文字幅の推定値
					});
				}
			} else {
				setShowSuggestions(false);
			}
		} else {
			setShowSuggestions(false);
		}
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
					ref={editorRef}
					className={
						errors.content ? "border border-destructive rounded-md" : ""
					}
				>
					<MDEditor
						value={markdownValue}
						onChange={handleEditorChange}
						commands={customCommands}
						preview="live"
						visibleDragbar={true}
						data-color-mode="light"
						height={500}
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

			{/* Wiki Linkサジェストポップアップ */}
			<ArticleSuggestionsPopover
				open={showSuggestions}
				onOpenChange={setShowSuggestions}
				query={debouncedSuggestionQuery}
				language="ja"
				onSelect={handleSuggestionSelect}
				position={cursorPosition}
			/>
		</form>
	);
}
