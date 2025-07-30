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
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	// サジェストを取得
	const { data, isLoading } = useArticleSuggestions({
		query,
		language,
		limit: 20,
		queryConfig: {
			enabled: open && query.length > 0,
		},
	});

	const suggestions = data?.suggestions || [];

	// キーボードナビゲーション
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// キーボードイベントがテキストエリアから来た場合のみ処理
			if (e.target && (e.target as HTMLElement).tagName === "TEXTAREA") {
				switch (e.key) {
					case "ArrowDown":
						e.preventDefault();
						e.stopPropagation();
						setSelectedIndex((prev) =>
							prev < suggestions.length - 1 ? prev + 1 : 0
						);
						break;
					case "ArrowUp":
						e.preventDefault();
						e.stopPropagation();
						setSelectedIndex((prev) =>
							prev > 0 ? prev - 1 : suggestions.length - 1
						);
						break;
					case "Enter":
						if (suggestions[selectedIndex]) {
							e.preventDefault();
							e.stopPropagation();
							onSelect(suggestions[selectedIndex]);
						}
						break;
					case "Escape":
						e.preventDefault();
						e.stopPropagation();
						onOpenChange(false);
						break;
				}
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

	// カスタムドロップダウンの実装（Popoverを使わない）
	if (!open) return null;

	// スマート位置調整（上下2方向）
	const calculatePosition = () => {
		if (!position) return undefined;

		const popoverHeight = 300; // 推定高さ
		const offset = 10; // カーソルからの余白
		const windowHeight = window.innerHeight;

		// 画面の下半分にカーソルがある場合は上に表示
		const showAbove = position.top > windowHeight / 2;

		return {
			top: showAbove
				? position.top - popoverHeight - offset
				: position.top + offset,
			left: position.left,
		};
	};

	return (
		<div
			className="fixed z-50 w-[400px] rounded-md border bg-popover shadow-md"
			style={calculatePosition()}
		>
			<Command shouldFilter={false} loop={true}>
				<CommandList>
					{isLoading && (
						<div className="px-2 py-6 text-center text-sm text-muted-foreground">
							読み込み中...
						</div>
					)}
					{!isLoading && suggestions.length === 0 && (
						<CommandEmpty>該当する記事が見つかりません</CommandEmpty>
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
