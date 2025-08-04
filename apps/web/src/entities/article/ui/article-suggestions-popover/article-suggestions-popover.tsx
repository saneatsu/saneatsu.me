"use client";

import { FileText, Hash } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "../../../../shared/ui/command/command";
import {
	type SuggestionItem,
	useArticleSuggestions,
} from "../../api/use-suggestions";

/**
 * サジェストポップアップのプロパティ
 */
export interface ArticleSuggestionsPopoverProps {
	/** ポップアップの開閉状態 */
	open: boolean;
	/** ポップアップの開閉を設定する関数 */
	onOpenChange: (open: boolean) => void;
	/** 検索クエリ */
	query: string;
	/** 言語設定 */
	language?: "ja" | "en";
	/** サジェストが選択された時のコールバック */
	onSelect: (suggestion: SuggestionItem) => void;
	/** カーソル位置（ポップアップの表示位置用） */
	position?: { top: number; left: number };
	/** フィルターモード（見出しのみ表示する場合） */
	filterMode?: "heading";
	/** 対象記事のスラッグ（見出しフィルタリング用） */
	targetSlug?: string;
}

/**
 * 記事サジェストポップアップコンポーネント
 *
 * @description
 * Wiki Link機能で使用される記事と見出しのサジェストを表示するポップアップ。
 * `[[`を入力した際に表示され、記事タイトルや見出しから選択できます。
 *
 * @example
 * ```tsx
 * <ArticleSuggestionsPopover
 *   open={showSuggestions}
 *   onOpenChange={setShowSuggestions}
 *   query={searchQuery}
 *   language="ja"
 *   onSelect={(suggestion) => {
 *     // エディタに[[slug]]を挿入
 *     insertTextAtCursor(`[[${suggestion.slug}]]`);
 *   }}
 * />
 * ```
 */
export const ArticleSuggestionsPopover: FC<ArticleSuggestionsPopoverProps> = ({
	open,
	onOpenChange,
	query,
	language = "ja",
	onSelect,
	position,
	filterMode,
	targetSlug,
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	// サジェストを取得
	const { data, isLoading } = useArticleSuggestions({
		query,
		language,
		limit: 20,
		targetSlug,
		queryConfig: {
			// 空文字列でも全記事を表示するために、openだけで有効化
			enabled: open,
		},
	});

	// サジェスト一覧（targetSlugが指定されている場合はバックエンドで既にフィルタリング済み）
	const suggestions = data?.suggestions || [];

	// キーボードナビゲーション
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl+P または Ctrl+N の処理
			if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
				// Ctrl+P: 上へ移動
				if (
					e.target &&
					((e.target as HTMLElement).tagName === "TEXTAREA" ||
						(e.target as HTMLElement).closest(".w-md-editor"))
				) {
					e.preventDefault();
					e.stopPropagation();
					setSelectedIndex((prev) =>
						prev > 0 ? prev - 1 : suggestions.length - 1
					);
				}
				return;
			}

			if (e.ctrlKey && (e.key === "n" || e.key === "N")) {
				// Ctrl+N: 下へ移動
				if (
					e.target &&
					((e.target as HTMLElement).tagName === "TEXTAREA" ||
						(e.target as HTMLElement).closest(".w-md-editor"))
				) {
					e.preventDefault();
					e.stopPropagation();
					setSelectedIndex((prev) =>
						prev < suggestions.length - 1 ? prev + 1 : 0
					);
				}
				return;
			}

			switch (e.key) {
				case "Escape":
					// Escapeキーは常に処理（ポップオーバーを閉じる）
					e.preventDefault();
					e.stopPropagation();
					onOpenChange(false);
					break;
				case "Tab":
					// Tab/Shift+Tabでナビゲーション
					e.preventDefault();
					e.stopPropagation();
					if (e.shiftKey) {
						// Shift+Tab: 上へ移動
						setSelectedIndex((prev) =>
							prev > 0 ? prev - 1 : suggestions.length - 1
						);
					} else {
						// Tab: 下へ移動
						setSelectedIndex((prev) =>
							prev < suggestions.length - 1 ? prev + 1 : 0
						);
					}
					break;
				case "ArrowDown":
					// 矢印キーとEnterはMDEditor内での操作時のみ
					if (
						e.target &&
						((e.target as HTMLElement).tagName === "TEXTAREA" ||
							(e.target as HTMLElement).closest(".w-md-editor"))
					) {
						e.preventDefault();
						e.stopPropagation();
						setSelectedIndex((prev) =>
							prev < suggestions.length - 1 ? prev + 1 : 0
						);
					}
					break;
				case "ArrowUp":
					if (
						e.target &&
						((e.target as HTMLElement).tagName === "TEXTAREA" ||
							(e.target as HTMLElement).closest(".w-md-editor"))
					) {
						e.preventDefault();
						e.stopPropagation();
						setSelectedIndex((prev) =>
							prev > 0 ? prev - 1 : suggestions.length - 1
						);
					}
					break;
				case "Enter":
					// IME入力中（日本語変換など）は処理をスキップして重複を防ぐ
					if (e.isComposing) {
						return;
					}

					if (
						e.target &&
						((e.target as HTMLElement).tagName === "TEXTAREA" ||
							(e.target as HTMLElement).closest(".w-md-editor")) &&
						suggestions[selectedIndex]
					) {
						e.preventDefault();
						e.stopPropagation();
						onSelect(suggestions[selectedIndex]);
					}
					break;
			}
		};

		// キャプチャーフェーズで処理する
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [open, selectedIndex, suggestions, onSelect, onOpenChange]);

	// ポップアップが開いたら選択インデックスをリセット
	useEffect(() => {
		if (open) {
			setSelectedIndex(0);
		}
	}, [open]);

	// 選択されたアイテムをスクロールして表示
	useEffect(() => {
		if (!open || suggestions.length === 0) return;

		// 選択されたアイテムの要素を探す
		const selectedElement = document.querySelector(
			`[data-suggestion-index="${selectedIndex}"]`
		);
		if (selectedElement) {
			selectedElement.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [selectedIndex, open, suggestions.length]);

	// カスタムドロップダウンの実装（Popoverを使わない）
	if (!open) return null;

	// スマート位置調整（入力テキストとの重複を避ける）
	const calculatePosition = () => {
		if (!position) return undefined;

		// textareaから実際のフォントサイズと行高を取得
		const textarea = document.querySelector(
			".w-md-editor-text-input"
		) as HTMLTextAreaElement;

		let actualLineHeight = 24; // デフォルト値
		if (textarea) {
			const computedStyle = window.getComputedStyle(textarea);
			const fontSize = parseInt(computedStyle.fontSize) || 16;
			actualLineHeight = parseInt(computedStyle.lineHeight) || fontSize * 1.5;
		}

		const popoverHeight = 300; // 推定高さ
		const popoverWidth = 400; // Popoverの幅
		const minOffset = 5; // 最小オフセット（テキスト行との重複を避ける）
		const windowHeight = window.innerHeight;
		const windowWidth = window.innerWidth;
		const scrollY = window.scrollY;
		const scrollX = window.scrollX;

		// Popoverを下に表示した場合のスペースを計算
		const spaceBelow =
			windowHeight - (position.top - scrollY) - actualLineHeight;
		const spaceAbove = position.top - scrollY - minOffset;

		// 下に十分なスペースがあるかチェック
		const canShowBelow = spaceBelow >= popoverHeight + minOffset;
		const canShowAbove = spaceAbove >= popoverHeight;

		// 優先順位: 下→上
		const showBelow =
			canShowBelow || (!canShowAbove && spaceBelow > spaceAbove);

		let top: number;
		if (showBelow) {
			// 下に表示（カーソル行のすぐ下）
			top = position.top + actualLineHeight + minOffset;
		} else {
			// 上に表示（カーソル行のすぐ上）
			top = position.top - popoverHeight - minOffset;
		}

		// 左右の位置調整（画面からはみ出さないように）
		let left = position.left;
		if (left + popoverWidth > windowWidth + scrollX) {
			left = windowWidth + scrollX - popoverWidth - 10; // 右端から10px余白
		}
		if (left < scrollX) {
			left = scrollX + 10; // 左端から10px余白
		}

		// 上下の境界チェック
		if (top < scrollY) {
			top = scrollY + 10; // 画面上端から10px余白
		}
		if (top + popoverHeight > windowHeight + scrollY) {
			top = windowHeight + scrollY - popoverHeight - 10; // 画面下端から10px余白
		}

		return { top, left };
	};

	return (
		<div
			className="fixed z-50 w-[400px] rounded-md border bg-popover shadow-md"
			style={calculatePosition()}
			data-testid="wiki-link-suggestions"
		>
			<Command shouldFilter={false} loop={true}>
				<CommandList>
					{isLoading && (
						<div className="px-2 py-6 text-center text-sm text-muted-foreground">
							読み込み中...
						</div>
					)}
					{!isLoading && suggestions.length === 0 && (
						<CommandEmpty>
							{filterMode === "heading"
								? "この記事には見出しがありません"
								: "該当する記事が見つかりません"}
						</CommandEmpty>
					)}
					{!isLoading && suggestions.length > 0 && (
						<>
							{/* 記事タイトルのグループ */}
							{suggestions.some((s) => s.type === "article") && (
								<CommandGroup heading="記事">
									{suggestions
										.filter((s) => s.type === "article")
										.map((suggestion) => {
											const actualIndex = suggestions.indexOf(suggestion);
											return (
												<CommandItem
													key={`article-${suggestion.slug}`}
													value={suggestion.slug}
													onSelect={() => {
														onSelect(suggestion);
													}}
													className={
														actualIndex === selectedIndex ? "bg-accent" : ""
													}
													data-suggestion-index={actualIndex}
													data-testid="wiki-link-suggestion-item"
													data-highlighted={actualIndex === selectedIndex}
												>
													<FileText className="mr-2 h-4 w-4" />
													<span>{suggestion.title}</span>
												</CommandItem>
											);
										})}
								</CommandGroup>
							)}

							{/* 見出しのグループ */}
							{suggestions.some((s) => s.type === "heading") && (
								<CommandGroup heading="見出し">
									{suggestions
										.filter((s) => s.type === "heading")
										.map((suggestion) => {
											const actualIndex = suggestions.indexOf(suggestion);
											return (
												<CommandItem
													key={`heading-${suggestion.slug}-${suggestion.headingId}`}
													value={`${suggestion.slug}#${suggestion.headingId}`}
													onSelect={() => {
														onSelect(suggestion);
													}}
													className={
														actualIndex === selectedIndex ? "bg-accent" : ""
													}
													data-suggestion-index={actualIndex}
													data-testid="wiki-link-suggestion-item"
													data-highlighted={actualIndex === selectedIndex}
												>
													<Hash className="mr-2 h-4 w-4" />
													<div className="flex flex-col">
														<span>{suggestion.title}</span>
														<span className="text-xs text-muted-foreground">
															{suggestion.articleTitle}
														</span>
													</div>
												</CommandItem>
											);
										})}
								</CommandGroup>
							)}
						</>
					)}
				</CommandList>
			</Command>
		</div>
	);
};
