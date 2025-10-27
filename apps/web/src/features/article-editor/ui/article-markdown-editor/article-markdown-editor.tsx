"use client";

import MDEditor, { commands, type ICommand } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import remarkGfm from "remark-gfm";

import {
	ArticleSuggestionsPopover,
	type SuggestionItem,
} from "@/entities/article";
import { type TagSuggestionItem, TagSuggestionsPopover } from "@/entities/tag";
import { remarkTag, remarkTweet, remarkWikiLink } from "@/shared/lib";
import { ArticleImage, TweetEmbed } from "@/shared/ui";

import { createImageUploadCommand } from "../../lib/image-upload-command/image-upload-command";
import { useClickExpansion } from "../../lib/use-click-expansion/use-click-expansion";
import { useDropImage } from "../../lib/use-drop-image/use-drop-image";
import { useImageUpload } from "../../lib/use-image-upload/use-image-upload";
import { useKeyboardShortcuts } from "../../lib/use-keyboard-shortcuts/use-keyboard-shortcuts";
import { usePasteImage } from "../../lib/use-paste-image/use-paste-image";
import { useTagDetection } from "../../model/use-tag-detection";
import { useWikiLinkDetection } from "../../model/use-wiki-link-detection";
import type { CursorPosition } from "./types";

// Wiki Linkコンポーネントを動的インポート（クライアントサイドのみ）
const WikiLink = dynamic(
	() => import("@/entities/article").then((mod) => mod.WikiLink),
	{
		ssr: false,
	}
);

/**
 * ArticleMarkdownEditorのプロパティ
 */
interface ArticleMarkdownEditorProps {
	/** Markdownの値 */
	value: string;
	/** 値が変更されたときのコールバック */
	onChange: (value: string) => void;
	/** フォームのsetValue関数（キーボードショートカット用） */
	setValue: (name: string, value: string) => void;
	/** エディタの高さ（ピクセル）*/
	height?: number;
	/** プレビューモード */
	preview?: "edit" | "live" | "preview";
	/** 追加のCSSクラス */
	className?: string;
	/** 言語（Wiki Link用） */
	language?: "ja" | "en";
}

/**
 * 記事用MarkdownEditorコンポーネント
 *
 * @description
 * 記事作成・編集用の高機能MarkdownEditor。
 * 以下の機能を提供：
 * - Wiki Link自動補完（[[記事名]]、[[記事名#見出し]]）
 * - タグ自動補完（#タグ名）
 * - キーボードショートカット（Cmd+B, Ctrl+B/F, Ctrl+H/D）
 * - 括弧の自動補完・ペア削除
 * - クリック領域拡張
 * - テーマ対応（ライト・ダーク）
 */
export function ArticleMarkdownEditor({
	value,
	onChange,
	setValue,
	height = 500,
	preview = "live",
	className = "",
	language = "ja",
}: ArticleMarkdownEditorProps) {
	const { theme } = useTheme();
	const editorRef = useRef<HTMLDivElement>(null);

	// Wiki Linkサジェスト関連の状態
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionQuery, setSuggestionQuery] = useState("");
	const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
		top: 0,
		left: 0,
	});
	const [isHeadingSuggestion, setIsHeadingSuggestion] = useState(false);
	const [targetArticleSlug, setTargetArticleSlug] = useState("");

	// タグサジェスト関連の状態
	const [showTagSuggestions, setShowTagSuggestions] = useState(false);
	const [tagQuery, setTagQuery] = useState("");
	const [tagCursorPosition, setTagCursorPosition] = useState<CursorPosition>({
		top: 0,
		left: 0,
	});

	// カスタムフックの適用
	useWikiLinkDetection({
		showSuggestions,
		setShowSuggestions,
		setSuggestionQuery,
		setCursorPosition,
		setIsHeadingSuggestion,
		setTargetArticleSlug,
	});

	useTagDetection({
		showTagSuggestions,
		setShowTagSuggestions,
		setTagQuery,
		setTagCursorPosition,
	});

	useKeyboardShortcuts({
		markdownValue: value,
		setMarkdownValue: onChange,
		setValue,
	});

	useClickExpansion();

	// 画像アップロード機能
	const { uploadImage } = useImageUpload();
	usePasteImage(editorRef, uploadImage, onChange);
	useDropImage(editorRef, uploadImage, onChange);

	// カスタムboldコマンド（Cmd+Bを使用）
	const customBold: ICommand = {
		...commands.bold,
		shortcuts: "cmd+b", // macOSの標準的なBoldショートカット
	};

	// カスタムhrコマンド（Ctrl+Hを無効化）
	const customHr: ICommand = {
		...commands.hr,
		execute: () => {
			// 何もしない（デフォルトのhr挿入を防ぐ）
		},
	};

	// カスタムlinkコマンド（Ctrl+Kを無効化）
	const customLink: ICommand = {
		...commands.link,
		shortcuts: undefined, // ショートカットを無効化
	};

	// カスタム画像アップロードコマンド
	const uploadImageCommand = createImageUploadCommand(uploadImage);

	// カスタムコマンドリスト（bold、hr、link、imageを置き換え）
	const customCommands = [
		customBold, // カスタムboldコマンドを使用（Cmd+Bに変更）
		commands.italic,
		commands.strikethrough,
		commands.code,
		customLink, // カスタムlinkコマンドを使用（Ctrl+K無効化）
		commands.quote,
		commands.codeBlock,
		commands.comment,
		uploadImageCommand, // カスタム画像アップロードコマンドを使用
		commands.table,
		customHr, // カスタムhrコマンドを使用
		commands.checkedListCommand,
		commands.orderedListCommand,
		commands.unorderedListCommand,
	];

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
		const beforeCursor = value.substring(0, cursorPos);
		const afterCursor = value.substring(cursorPos);

		// [[の開始位置を検索
		const startIndex = beforeCursor.lastIndexOf("[[");
		if (startIndex === -1) return;

		// カーソル後のテキストが]]で始まる場合はスキップ
		let adjustedAfterCursor = afterCursor;
		if (afterCursor.startsWith("]]")) {
			adjustedAfterCursor = afterCursor.substring(2);
		}

		// リンクテキストを生成（見出しの場合は#付き）
		let linkText: string;
		if (isHeadingSuggestion && suggestion.type === "heading") {
			// 見出しサジェストモードで見出しが選択された場合
			// [[article-040#]] -> [[article-040#heading-title]]
			const hashIndex = beforeCursor.substring(startIndex).indexOf("#");
			if (hashIndex !== -1) {
				// #の位置までの文字列を使用
				const beforeHash = beforeCursor.substring(
					startIndex,
					startIndex + hashIndex + 3
				); // [[article-040#
				linkText = `${beforeHash}${suggestion.headingId || suggestion.title}]]`;
			} else {
				// フォールバック
				linkText = `[[${targetArticleSlug}#${suggestion.headingId || suggestion.title}]]`;
			}
		} else if (suggestion.type === "heading") {
			// 通常の見出しサジェスト（記事も含めて表示される場合）
			linkText = `[[${suggestion.slug}#${suggestion.headingId || suggestion.title}]]`;
		} else {
			// 記事の場合は [[slug]] 形式
			linkText = `[[${suggestion.slug}]]`;
		}

		// 新しいコンテンツを構築
		const newContent =
			value.substring(0, startIndex) + linkText + adjustedAfterCursor;

		// 新しいカーソル位置を計算
		const newCursorPos = startIndex + linkText.length;

		onChange(newContent);
		setShowSuggestions(false);
		setSuggestionQuery("");
		setIsHeadingSuggestion(false);
		setTargetArticleSlug("");

		// フォーカスをMDEditorのテキストエリアに戻す
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	/**
	 * タグサジェスト選択時の処理
	 */
	const handleTagSelect = (tag: TagSuggestionItem) => {
		// 現在のカーソル位置から#を検索
		const textarea = editorRef.current?.querySelector(
			"textarea"
		) as HTMLTextAreaElement;
		if (!textarea) return;

		const cursorPos = textarea.selectionStart;
		const beforeCursor = value.substring(0, cursorPos);
		const afterCursor = value.substring(cursorPos);

		// #の開始位置を検索
		const startIndex = beforeCursor.lastIndexOf("#");
		if (startIndex === -1) return;

		// 新しいコンテンツを構築（タグの後にスペースを追加）
		const newContent = `${value.substring(0, startIndex)}#${tag.name} ${afterCursor}`;

		// 新しいカーソル位置を計算
		const newCursorPos = startIndex + `#${tag.name} `.length;

		onChange(newContent);
		setShowTagSuggestions(false);
		setTagQuery("");

		// フォーカスをMDEditorのテキストエリアに戻す（確実な復帰処理）
		setTimeout(() => {
			// 再度textareaを取得して確実にフォーカス
			const currentTextarea = editorRef.current?.querySelector(
				"textarea"
			) as HTMLTextAreaElement;
			if (currentTextarea) {
				currentTextarea.focus();
				currentTextarea.setSelectionRange(newCursorPos, newCursorPos);
			}
		}, 10); // 少し遅延を増やして確実にフォーカス復帰
	};

	return (
		<div className={className}>
			<div ref={editorRef}>
				<MDEditor
					value={value}
					onChange={(val) => onChange(val || "")}
					commands={customCommands}
					preview={preview}
					visibleDragbar={true}
					data-color-mode={theme === "dark" ? "dark" : "light"}
					height={height}
					className="prose-editor"
					previewOptions={{
						remarkPlugins: [
							[remarkGfm],
							[remarkWikiLink],
							[remarkTag],
							[remarkTweet],
						],
						className: "prose dark:prose-invert max-w-none",
						components: {
							a: ({
								children,
								href,
								...props
							}: {
								children?: React.ReactNode;
								href?: string;
								className?: string;
							}) => {
								// Wiki Linkの判定
								const className = props.className as string;
								const isWikiLink = className?.includes("wiki-link");

								// Wiki Linkの場合はカスタムコンポーネントを使用
								if (isWikiLink && href) {
									return (
										<WikiLink
											href={href}
											language={language}
											className={className}
											{...props}
										>
											{children}
										</WikiLink>
									);
								}

								// 通常のリンク
								return (
									<a href={href} className="underline" {...props}>
										{children}
									</a>
								);
							},
							// 画像のカスタムレンダリング
							img: ({ src, alt, ...props }) => {
								// Cloudflare Images URLの場合はArticleImageを使用
								if (src?.includes("imagedelivery.net")) {
									return <ArticleImage src={src} alt={alt} />;
								}

								// 通常の画像（外部URL）
								// biome-ignore lint/performance/noImgElement: 外部画像URLはNext.js Imageで最適化できないため<img>を使用
								return <img src={src} alt={alt} {...props} />;
							},
							// Tweet埋め込みのカスタムレンダリング
							// @ts-expect-error - カスタムノードのため型定義がない
							tweet: ({ id }) => <TweetEmbed id={id} />,
						},
					}}
				/>
			</div>

			{/* Wiki Linkサジェストポップアップ */}
			<ArticleSuggestionsPopover
				open={showSuggestions}
				onOpenChange={setShowSuggestions}
				query={suggestionQuery}
				language={language}
				onSelect={handleSuggestionSelect}
				position={cursorPosition}
				filterMode={isHeadingSuggestion ? "heading" : undefined}
				targetSlug={isHeadingSuggestion ? targetArticleSlug : undefined}
			/>

			{/* タグサジェストポップアップ */}
			<TagSuggestionsPopover
				open={showTagSuggestions}
				onOpenChange={setShowTagSuggestions}
				query={tagQuery}
				onSelect={handleTagSelect}
				position={tagCursorPosition}
			/>
		</div>
	);
}
