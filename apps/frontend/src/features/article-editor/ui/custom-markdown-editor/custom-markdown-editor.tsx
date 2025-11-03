"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { extractHeadings } from "@/shared/lib";
import { MarkdownPreview } from "@/shared/ui";

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
	setValue: _setValue,
	height = 500,
	className = "",
	language = "ja",
	enContent,
}: CustomMarkdownEditorProps) {
	const { theme } = useTheme();
	const editorRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);

	// Markdownから見出しを抽出（プレビュー用）
	const headings = extractHeadings(value);

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
						<textarea
							ref={textareaRef}
							value={value}
							onChange={handleChange}
							className="w-full h-full p-4 bg-background text-foreground resize-none focus:outline-none font-mono text-sm"
							placeholder="Markdownを入力してください..."
							aria-label="Markdown editor"
						/>
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
		</div>
	);
}
