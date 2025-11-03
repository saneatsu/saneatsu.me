/**
 * カーソル位置
 */
export interface CursorPosition {
	top: number;
	left: number;
}

/**
 * サジェストアイテム（Wiki Link用）
 */
export interface SuggestionItem {
	id: number;
	slug: string;
	title: string;
	type: "article" | "heading";
	headingId?: string;
}

/**
 * タグサジェストアイテム
 */
export interface TagSuggestionItem {
	id: number;
	slug: string;
	name: string;
	type: "tag";
	usageCount?: number;
}
