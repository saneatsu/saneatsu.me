"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import {
	ArticleSuggestionsPopover,
	type SuggestionItem,
} from "@/entities/article";
import { extractHeadings } from "@/shared/lib";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	MarkdownPreview,
} from "@/shared/ui";

import { useBracketCompletion } from "../../lib/use-bracket-completion/use-bracket-completion";
import { useClickExpansionTextarea } from "../../lib/use-click-expansion-textarea/use-click-expansion-textarea";
import { useDropImageTextarea } from "../../lib/use-drop-image-textarea/use-drop-image-textarea";
import { useImageUpload } from "../../lib/use-image-upload/use-image-upload";
import { useImageUploadFile } from "../../lib/use-image-upload-file/use-image-upload-file";
import { useListAutoContinuation } from "../../lib/use-list-auto-continuation/use-list-auto-continuation";
import { useMarkdownFormatting } from "../../lib/use-markdown-formatting/use-markdown-formatting";
import { usePasteImageTextarea } from "../../lib/use-paste-image-textarea/use-paste-image-textarea";
import { useTagDetection } from "../../lib/use-tag-detection/use-tag-detection";
import { useUnixKeybindings } from "../../lib/use-unix-keybindings/use-unix-keybindings";
import { useWikiLinkDetection } from "../../model/use-wiki-link-detection";
import type { CursorPosition } from "../article-markdown-editor/types";
import { GalleryImageUploadDialog } from "../gallery-image-upload-dialog/gallery-image-upload-dialog";

/**
 * CustomMarkdownEditorのプロパティ
 */
interface CustomMarkdownEditorProps {
	/** Markdownの値 */
	value: string;
	/** 値が変更されたときのコールバック */
	onChange: (value: string) => void;
	/** フォームのsetValue関数（キーボードショートカット用） */
	setValue: (name: string, value: string) => void;
	/** エディタの高さ（ピクセル）*/
	height?: number;
	/** 追加のCSSクラス */
	className?: string;
	/** 言語（Wiki Link用） */
	language?: "ja" | "en";
	/** 英語コンテンツ（プレビュー表示用） */
	enContent?: string;
	/** タグ検知時のコールバック */
	onTagDetection?: (detected: boolean, query: string) => void;
}

/**
 * カスタムMarkdownEditorコンポーネント
 *
 * @description
 * 完全独自実装のMarkdownエディタ。
 * textareaベースのシンプルな実装で、段階的に機能を追加していく。
 *
 * Phase 1.1: 基本的なテキストエディタとプレビュー表示
 */
export function CustomMarkdownEditor({
	value,
	onChange,
	setValue,
	height = 500,
	className = "",
	language = "ja",
	enContent,
	onTagDetection,
}: CustomMarkdownEditorProps) {
	const { theme } = useTheme();
	const editorRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);

	// Markdownから見出しを抽出（プレビュー用）
	const headings = extractHeadings(value);

	// Wiki Link サジェスト用のステート
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionQuery, setSuggestionQuery] = useState("");
	const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
		top: 0,
		left: 0,
	});
	const [isHeadingSuggestion, setIsHeadingSuggestion] = useState(false);
	const [targetArticleSlug, setTargetArticleSlug] = useState("");

	// 画像アップロード
	const { uploadImage } = useImageUpload();

	// ペースト画像アップロード
	usePasteImageTextarea(textareaRef, uploadImage, onChange);

	// ドラッグ&ドロップ画像アップロード
	useDropImageTextarea(textareaRef, uploadImage, onChange);

	// ファイル選択画像アップロード
	const { openFileDialog } = useImageUploadFile(
		textareaRef,
		uploadImage,
		onChange
	);

	// 括弧自動補完
	useBracketCompletion({
		textareaRef,
		setMarkdownValue: onChange,
		setValue,
	});

	// リスト自動継続
	useListAutoContinuation({
		textareaRef,
		setMarkdownValue: onChange,
		setValue,
	});

	// Markdownフォーマット
	useMarkdownFormatting({
		textareaRef,
		setMarkdownValue: onChange,
		setValue,
	});

	// Unixキーバインディング
	useUnixKeybindings({
		textareaRef,
	});

	// タグ検知
	useTagDetection({
		textareaRef,
		onTagDetection,
	});

	// Wiki Link検知
	useWikiLinkDetection({
		textareaRef,
		setShowSuggestions,
		setSuggestionQuery,
		setCursorPosition,
		setIsHeadingSuggestion,
		setTargetArticleSlug,
	});

	// クリック領域拡張
	useClickExpansionTextarea({
		editorRef,
		textareaRef,
	});

	// スクロール同期（エディタ → プレビュー）
	useEffect(() => {
		// DOM要素のマウントを待つ
		const timer = setTimeout(() => {
			const textareaElement = textareaRef.current;
			const previewElement = previewRef.current;

			if (!textareaElement || !previewElement) return;

			let rafId: number | null = null;

			const handleScroll = (event: Event) => {
				const target = event.target as HTMLElement;

				// 既存のrequestAnimationFrameをキャンセル
				if (rafId !== null) {
					cancelAnimationFrame(rafId);
				}

				// 次のフレームでスクロール同期を実行
				rafId = requestAnimationFrame(() => {
					// エディタとプレビューのスクロール可能な高さを計算
					const editorScrollableHeight =
						target.scrollHeight - target.offsetHeight;
					const previewScrollableHeight =
						previewElement.scrollHeight - previewElement.offsetHeight;

					if (editorScrollableHeight > 0 && previewScrollableHeight > 0) {
						const scale = editorScrollableHeight / previewScrollableHeight;
						const newPreviewScrollTop = target.scrollTop / scale;

						previewElement.scrollTop = newPreviewScrollTop;
					}
				});
			};

			// textareaのスクロールイベントをリッスン
			textareaElement.addEventListener("scroll", handleScroll);

			// クリーンアップ関数を返す
			return () => {
				if (rafId !== null) {
					cancelAnimationFrame(rafId);
				}
				textareaElement.removeEventListener("scroll", handleScroll);
			};
		}, 100);

		// タイマーのクリーンアップ
		return () => {
			clearTimeout(timer);
		};
	}, []);

	/**
	 * テキストエリアの値変更ハンドラ
	 */
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value);
	};

	/**
	 * ギャラリー画像アップロード成功ハンドラー
	 *
	 * @description
	 * ギャラリー画像アップロード成功時にMarkdownをtextareaに挿入する。
	 *
	 * @param markdown - Markdown形式の画像挿入テキスト
	 * @param _imageId - Cloudflare Images ID（未使用）
	 *
	 * 処理の流れ：
	 * 1. textareaの現在のカーソル位置を取得
	 * 2. カーソル位置にMarkdownを挿入
	 * 3. カーソル位置を挿入したMarkdownの後ろに移動
	 */
	const handleGalleryImageUploadSuccess = (
		markdown: string,
		_imageId: string
	) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const currentValue = textarea.value;
		const cursorPos = textarea.selectionStart;

		// カーソル位置にMarkdownを挿入
		const beforeCursor = currentValue.substring(0, cursorPos);
		const afterCursor = currentValue.substring(cursorPos);

		// 改行を追加（カーソルが行の途中にある場合）
		const needsNewlineBefore =
			beforeCursor.length > 0 && !beforeCursor.endsWith("\n");
		const needsNewlineAfter =
			afterCursor.length > 0 && !afterCursor.startsWith("\n");

		const newValue = `${beforeCursor}${needsNewlineBefore ? "\n" : ""}${markdown}${needsNewlineAfter ? "\n" : ""}${afterCursor}`;

		// 新しい値を設定
		onChange(newValue);

		// カーソル位置を挿入したMarkdownの後ろに移動
		const newCursorPos =
			cursorPos + (needsNewlineBefore ? 1 : 0) + markdown.length;

		// 次のフレームでカーソル位置を設定（textarea.valueが更新された後）
		setTimeout(() => {
			textarea.setSelectionRange(newCursorPos, newCursorPos);
			textarea.focus();
		}, 0);
	};

	/**
	 * サジェスト選択ハンドラ
	 *
	 * @description
	 * サジェストが選択されたときに呼ばれる。
	 * textareaに選択されたWiki Linkを挿入する。
	 *
	 * @param suggestion - 選択されたサジェスト
	 *
	 * 処理の流れ：
	 * 1. textareaの現在の値とカーソル位置を取得
	 * 2. [[の位置を探す
	 * 3. [[から現在のカーソル位置までのテキストを削除
	 * 4. 選択されたサジェストのテキストを挿入
	 * 5. ]]を追加
	 * 6. カーソル位置を]]の後ろに移動
	 * 7. ポップアップを閉じる
	 */
	const handleSuggestionSelect = (suggestion: SuggestionItem) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const currentValue = textarea.value;
		const cursorPos = textarea.selectionStart;

		// [[の位置を探す（最後の[[）
		const beforeCursor = currentValue.substring(0, cursorPos);
		const lastBracketIndex = beforeCursor.lastIndexOf("[[");

		if (lastBracketIndex === -1) {
			// [[が見つからない場合は何もしない
			setShowSuggestions(false);
			return;
		}

		// 挿入するテキストを構築
		let insertText = suggestion.slug;
		if (suggestion.type === "heading" && suggestion.headingId) {
			insertText = `${suggestion.slug}#${suggestion.headingId}`;
		}

		// [[の後ろから現在のカーソル位置までを削除して、新しいテキストを挿入
		const beforeBracket = currentValue.substring(0, lastBracketIndex + 2); // [[まで
		const afterCursor = currentValue.substring(cursorPos);

		// ]]が既に存在するかチェック
		const hasClosingBracket = afterCursor.startsWith("]]");
		const newValue = hasClosingBracket
			? `${beforeBracket}${insertText}${afterCursor}`
			: `${beforeBracket}${insertText}]]${afterCursor}`;

		// 新しい値を設定
		onChange(newValue);

		// カーソル位置を]]の後ろに移動
		const newCursorPos = hasClosingBracket
			? lastBracketIndex + 2 + insertText.length + 2
			: lastBracketIndex + 2 + insertText.length + 2;

		// 次のフレームでカーソル位置を設定（textarea.valueが更新された後）
		setTimeout(() => {
			textarea.setSelectionRange(newCursorPos, newCursorPos);
			textarea.focus();
		}, 0);

		// ポップアップを閉じる
		setShowSuggestions(false);
	};

	return (
		<div className={className}>
			<div className="grid grid-cols-2 gap-4">
				{/* 左側: エディタ */}
				<div ref={editorRef} className="h-full">
					<div
						className="border rounded-lg overflow-hidden"
						style={{ height }}
						data-color-mode={theme === "dark" ? "dark" : "light"}
					>
						<ContextMenu>
							<ContextMenuTrigger asChild>
								<textarea
									ref={textareaRef}
									value={value}
									onChange={handleChange}
									className="w-full h-full p-4 bg-background text-foreground resize-none focus:outline-none font-mono text-sm"
									placeholder="Markdownを入力してください..."
									aria-label="Markdown editor"
								/>
							</ContextMenuTrigger>
							<ContextMenuContent>
								<ContextMenuItem onSelect={openFileDialog}>
									画像をアップロード（コンテンツ）
								</ContextMenuItem>
								<GalleryImageUploadDialog
									trigger={
										<ContextMenuItem onSelect={(e) => e.preventDefault()}>
											画像をアップロード（ギャラリー）
										</ContextMenuItem>
									}
									onSuccess={handleGalleryImageUploadSuccess}
								/>
							</ContextMenuContent>
						</ContextMenu>
					</div>
				</div>

				{/* 右側: プレビュー */}
				<div
					className="h-full flex flex-col border rounded-lg bg-background"
					style={{ height }}
				>
					{/* プレビューコンテンツ */}
					<div ref={previewRef} className="flex-1 overflow-y-auto p-4">
						<MarkdownPreview
							content={language === "en" && enContent ? enContent : value}
							language={language}
							imageComponent="article"
							headings={headings}
						/>
					</div>
				</div>
			</div>

			{/* Wiki Link サジェストポップアップ */}
			<ArticleSuggestionsPopover
				open={showSuggestions}
				onOpenChange={setShowSuggestions}
				query={suggestionQuery}
				language={language}
				onSelect={handleSuggestionSelect}
				position={cursorPosition}
				filterMode={isHeadingSuggestion ? "heading" : undefined}
				targetSlug={targetArticleSlug || undefined}
			/>
		</div>
	);
}
