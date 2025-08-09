"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor, { commands, type ICommand } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import { useCheckSlug } from "../../../../entities/article/api/use-check-slug/use-check-slug";
import type { SuggestionItem } from "../../../../entities/article/api/use-suggestions/use-suggestions";
import { useUpdate } from "../../../../entities/article/api/use-update/use-update";
import { ArticleSuggestionsPopover } from "../../../../entities/article/ui";
import {
	type TagSuggestionItem,
	TagSuggestionsPopover,
} from "../../../../entities/tag/ui";
import { useDebounce } from "../../../../shared/hooks/use-debounce";
import { remarkTag } from "../../../../shared/lib/remark-tag";
import { remarkWikiLink } from "../../../../shared/lib/remark-wiki-link";
import { Button } from "../../../../shared/ui/button/button";
import { Input } from "../../../../shared/ui/input/input";
import { Label } from "../../../../shared/ui/label/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "../../../../shared/ui/radio-group/radio-group";

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
 */
export function ArticleEditForm({ article }: ArticleEditFormProps) {
	const { theme } = useTheme();
	const [markdownValue, setMarkdownValue] = useState(article.content || "");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionQuery, setSuggestionQuery] = useState("");
	const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
	const [showTagSuggestions, setShowTagSuggestions] = useState(false);
	const [tagQuery, setTagQuery] = useState("");
	const [tagCursorPosition, setTagCursorPosition] = useState({
		top: 0,
		left: 0,
	});
	// 見出しサジェスト用の状態
	const [isHeadingSuggestion, setIsHeadingSuggestion] = useState(false);
	const [targetArticleSlug, setTargetArticleSlug] = useState("");
	const editorRef = useRef<HTMLDivElement>(null);

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
		if (selectedTagIds.length === 0) {
			alert("少なくとも1つのタグを選択してください");
			return;
		}

		await updateMutation.mutateAsync({
			id: article.id,
			data: {
				...data,
				tagIds: selectedTagIds,
			},
		});
	};

	/**
	 * Wiki Link サジェスト処理
	 */
	const handleWikiLinkInput = (
		text: string,
		position: { x: number; y: number }
	) => {
		const match = text.match(/\[\[([^\]#]*)(?:#([^\]]*))?\]?$/);
		if (match) {
			const query = match[1] || "";
			const heading = match[2] || "";

			if (heading) {
				// 見出しサジェスト
				setIsHeadingSuggestion(true);
				setTargetArticleSlug(query);
				setSuggestionQuery(heading);
			} else {
				// 記事サジェスト
				setIsHeadingSuggestion(false);
				setTargetArticleSlug("");
				setSuggestionQuery(query);
			}

			setShowSuggestions(true);
			setCursorPosition({ top: position.y, left: position.x });
		} else {
			setShowSuggestions(false);
		}
	};

	/**
	 * タグサジェスト処理
	 */
	const handleTagInput = (text: string, position: { x: number; y: number }) => {
		const match = text.match(/#([^\s#]*)$/);
		if (match) {
			setTagQuery(match[1] || "");
			setShowTagSuggestions(true);
			setTagCursorPosition({ top: position.y, left: position.x });
		} else {
			setShowTagSuggestions(false);
		}
	};

	/**
	 * エディタの変更処理
	 */
	const handleEditorChange = (value?: string) => {
		const newValue = value || "";
		setMarkdownValue(newValue);

		// カーソル位置の取得（簡易版）
		const cursorPos = { x: 100, y: 100 }; // 実際の実装では適切に計算

		// Wiki Linkとタグの入力を検知
		handleWikiLinkInput(newValue, cursorPos);
		handleTagInput(newValue, cursorPos);
	};

	/**
	 * サジェスト選択処理
	 */
	const handleSuggestionSelect = (item: SuggestionItem) => {
		const cursorIndex = markdownValue.lastIndexOf("[[");
		if (cursorIndex !== -1) {
			const beforeCursor = markdownValue.slice(0, cursorIndex);
			const afterBrackets = markdownValue.slice(cursorIndex);
			const closeBracketIndex = afterBrackets.indexOf("]]");

			let newValue: string;
			if (item.type === "heading" && item.slug) {
				// 見出しの場合
				newValue = `${beforeCursor}[[${item.slug}#${item.title}]]${
					closeBracketIndex !== -1
						? afterBrackets.slice(closeBracketIndex + 2)
						: ""
				}`;
			} else {
				// 記事の場合
				newValue = `${beforeCursor}[[${item.slug}]]${
					closeBracketIndex !== -1
						? afterBrackets.slice(closeBracketIndex + 2)
						: ""
				}`;
			}

			setMarkdownValue(newValue);
			setShowSuggestions(false);
		}
	};

	/**
	 * タグサジェスト選択処理
	 */
	const handleTagSelect = (tag: TagSuggestionItem) => {
		const hashIndex = markdownValue.lastIndexOf("#");
		if (hashIndex !== -1) {
			const beforeHash = markdownValue.slice(0, hashIndex);
			const afterHash = markdownValue.slice(hashIndex);
			const spaceIndex = afterHash.indexOf(" ");
			const newlineIndex = afterHash.indexOf("\n");

			let endIndex = afterHash.length;
			if (spaceIndex !== -1) endIndex = Math.min(endIndex, spaceIndex);
			if (newlineIndex !== -1) endIndex = Math.min(endIndex, newlineIndex);

			const newValue = `${beforeHash}#${tag.slug}${afterHash.slice(endIndex)}`;
			setMarkdownValue(newValue);
			setShowTagSuggestions(false);
		}
	};

	// カスタムコマンド（Wiki Link挿入）
	const wikiLinkCommand: ICommand = {
		name: "wiki-link",
		keyCommand: "wikiLink",
		buttonProps: { "aria-label": "Wiki Link" },
		icon: <span style={{ fontSize: 12, fontWeight: "bold" }}>[[]]</span>,
		execute: (
			state: { selection: { start: number; end: number } },
			api: {
				replaceSelection: (text: string) => void;
				setSelectionRange: (range: { start: number; end: number }) => void;
			}
		) => {
			const newText = "[[";
			api.replaceSelection(newText);
			// カーソル位置を [[ の間に移動
			const newCursorPos = state.selection.start + 2;
			api.setSelectionRange({
				start: newCursorPos,
				end: newCursorPos,
			});
		},
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
				<p className="text-sm text-muted-foreground">
					現在選択されているタグ:{" "}
					{article.tags.map((tag) => tag.slug).join(", ") || "なし"}
				</p>
				<p className="text-sm text-muted-foreground">
					※ タグ編集機能は現在開発中です。本文内で#タグを使用してください。
				</p>
			</div>

			{/* 本文エディタ */}
			<div className="space-y-2">
				<Label>本文 *</Label>
				<div ref={editorRef} className="relative">
					<MDEditor
						value={markdownValue}
						onChange={handleEditorChange}
						preview="edit"
						height={600}
						data-color-mode={theme === "dark" ? "dark" : "light"}
						commands={[
							...commands
								.getCommands()
								.filter((cmd) => cmd.keyCommand !== "fullscreen"),
							wikiLinkCommand,
						]}
						extraCommands={[
							commands.codeEdit,
							commands.codeLive,
							commands.codePreview,
						]}
						previewOptions={{
							remarkPlugins: [remarkGfm, remarkWikiLink, remarkTag],
						}}
					/>
					{errors.content && (
						<p className="text-sm text-destructive mt-2">
							{errors.content.message}
						</p>
					)}
				</div>
			</div>

			{/* Wiki Link サジェストポップオーバー */}
			<ArticleSuggestionsPopover
				open={showSuggestions}
				onOpenChange={setShowSuggestions}
				query={suggestionQuery}
				position={cursorPosition}
				onSelect={handleSuggestionSelect}
				filterMode={isHeadingSuggestion ? "heading" : undefined}
				targetSlug={targetArticleSlug}
			/>

			{/* タグサジェストポップオーバー */}
			<TagSuggestionsPopover
				open={showTagSuggestions}
				onOpenChange={setShowTagSuggestions}
				query={tagQuery}
				position={tagCursorPosition}
				onSelect={handleTagSelect}
			/>

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
