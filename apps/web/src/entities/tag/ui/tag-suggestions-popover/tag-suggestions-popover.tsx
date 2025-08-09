"use client";

import { Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Command,
	CommandItem,
	CommandList,
} from "../../../../shared/ui/command/command";
import { Popover, PopoverContent } from "../../../../shared/ui/popover/popover";

/**
 * タグサジェストアイテムの型定義
 */
export interface TagSuggestionItem {
	id: number;
	slug: string;
	name: string;
	usageCount?: number;
	type: "tag";
}

interface TagSuggestionsPopoverProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	query: string;
	onSelect: (tag: TagSuggestionItem) => void;
	position: { top: number; left: number };
}

/**
 * タグサジェストポップオーバーコンポーネント
 *
 * @description
 * タグ入力時に表示されるサジェストポップオーバー
 * #を入力した際に既存のタグから候補を表示する
 */
export function TagSuggestionsPopover({
	open,
	onOpenChange,
	query,
	onSelect,
	position,
}: TagSuggestionsPopoverProps) {
	const [suggestions, setSuggestions] = useState<TagSuggestionItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const popoverRef = useRef<HTMLDivElement>(null);

	// タグサジェストを取得
	useEffect(() => {
		if (!open) {
			setSuggestions([]);
			setSelectedIndex(0);
			return;
		}

		// 空クエリの場合はAPI呼び出しを行わない
		if (query.trim().length === 0) {
			setSuggestions([]);
			setSelectedIndex(0);
			setLoading(false);
			return;
		}

		const fetchSuggestions = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/tags/suggestions?q=${encodeURIComponent(query)}`
				);
				const data = await response.json();
				setSuggestions(data.suggestions || []);
				setSelectedIndex(0);
			} catch (error) {
				console.error("タグサジェストの取得に失敗:", error);
				setSuggestions([]);
			} finally {
				setLoading(false);
			}
		};

		fetchSuggestions();
	}, [open, query]);

	// キーボードナビゲーション
	useEffect(() => {
		if (!open || suggestions.length === 0) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl+P: 上へ移動
			if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
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

			// Ctrl+N: 下へ移動
			if (e.ctrlKey && (e.key === "n" || e.key === "N")) {
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

			// 上下矢印キーでも移動可能
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : suggestions.length - 1
				);
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < suggestions.length - 1 ? prev + 1 : 0
				);
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (suggestions[selectedIndex]) {
					onSelect(suggestions[selectedIndex]);
				}
			} else if (e.key === "Escape") {
				e.preventDefault();
				onOpenChange(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, suggestions, selectedIndex, onSelect, onOpenChange]);

	// ダミーのアンカー要素を作成（ポップオーバーの位置調整用）
	const anchorStyle = {
		position: "fixed" as const,
		top: position.top,
		left: position.left,
		width: 0,
		height: 0,
		pointerEvents: "none" as const,
	};

	return (
		<>
			<div style={anchorStyle} />
			<Popover
				open={open}
				onOpenChange={(newOpen) => {
					onOpenChange(newOpen);
					// ポップオーバーが閉じられた時にtextareaにフォーカスを戻す
					if (!newOpen) {
						setTimeout(() => {
							const textarea = document.querySelector(
								".w-md-editor-text-input"
							) as HTMLTextAreaElement;
							if (textarea) {
								textarea.focus();
							}
						}, 0);
					}
				}}
				modal={false}
			>
				<PopoverContent
					ref={popoverRef}
					className="w-64 p-0"
					align="start"
					sideOffset={5}
					style={{
						position: "fixed",
						top: position.top + 20,
						left: position.left,
					}}
					data-testid="tag-suggestions"
				>
					<Command>
						<CommandList className="max-h-72 overflow-y-auto">
							{loading ? (
								<div className="px-2 py-3 text-sm text-muted-foreground flex items-center">
									<Tag className="mr-2 h-4 w-4" />
									読み込み中...
								</div>
							) : suggestions.length === 0 ? (
								<div className="px-2 py-3 text-sm text-muted-foreground flex items-center">
									<Tag className="mr-2 h-4 w-4" />
									{query ? "タグが見つかりません" : "まだタグがありません"}
								</div>
							) : (
								suggestions.map((suggestion, index) => (
									<CommandItem
										key={suggestion.id}
										onSelect={() => onSelect(suggestion)}
										className="cursor-pointer"
										data-selected={index === selectedIndex}
									>
										<Tag className="mr-2 h-4 w-4" />
										<span className="flex-1">{suggestion.name}</span>
										<span className="text-xs text-muted-foreground">
											{suggestion.usageCount}件
										</span>
									</CommandItem>
								))
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	);
}
