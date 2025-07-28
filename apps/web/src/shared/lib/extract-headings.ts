/**
 * Markdownテキストからヘッダーを抽出し、目次として使用可能なデータ構造を生成するユーティリティ
 */

/**
 * ヘッダー項目の型定義
 */
export interface HeadingItem {
	/** アンカーリンク用のID */
	id: string;
	/** ヘッダーのテキスト内容 */
	text: string;
	/** ヘッダーレベル (1-6) */
	level: number;
}

/**
 * 文字列をURL-safeなスラッグに変換する
 * 
 * @description
 * 日本語や英語を含む文字列をアンカーリンク用のIDに変換します。
 * 
 * @param text - 変換する文字列
 * @returns URL-safeなスラッグ文字列
 * 
 * @example
 * ```typescript
 * slugify("はじめに"); // "はじめに"
 * slugify("Getting Started"); // "getting-started"
 * slugify("React の使い方"); // "react-の使い方"
 * ```
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		// 英数字、ひらがな、カタカナ、漢字、ハイフン、アンダースコア以外を除去
		.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF-]/g, '-')
		// 連続するハイフンを1つに
		.replace(/-+/g, '-')
		// 前後のハイフンを除去
		.replace(/^-|-$/g, '');
}

/**
 * Markdownテキストからヘッダーを抽出する
 * 
 * @description
 * Markdownのヘッダー記法（# ## ### など）を解析し、
 * 目次として使用可能なヘッダー一覧を返します。
 * 
 * @param markdown - 解析するMarkdownテキスト
 * @returns ヘッダー項目の配列
 * 
 * @example
 * ```typescript
 * const markdown = `
 * # はじめに
 * ## インストール
 * ### 必要な環境
 * ## 使い方
 * `;
 * 
 * const headings = extractHeadings(markdown);
 * // [
 * //   { id: "はじめに", text: "はじめに", level: 1 },
 * //   { id: "インストール", text: "インストール", level: 2 },
 * //   { id: "必要な環境", text: "必要な環境", level: 3 },
 * //   { id: "使い方", text: "使い方", level: 2 }
 * // ]
 * ```
 */
export function extractHeadings(markdown: string): HeadingItem[] {
	if (!markdown) {
		return [];
	}

	const headings: HeadingItem[] = [];
	const lines = markdown.split('\n');
	const seenIds = new Set<string>();

	for (const line of lines) {
		// ヘッダー記法のマッチング（# ## ### #### ##### ######）
		const match = line.match(/^(#{1,6})\s+(.+)$/);
		
		if (match) {
			const level = match[1].length; // #の数がレベル
			const text = match[2].trim(); // ヘッダーテキスト
			
			// アンカーID生成（重複防止のため連番を付与）
			let baseId = slugify(text);
			let id = baseId;
			let counter = 1;
			
			while (seenIds.has(id)) {
				id = `${baseId}-${counter}`;
				counter++;
			}
			
			seenIds.add(id);
			
			headings.push({
				id,
				text,
				level,
			});
		}
	}

	return headings;
}

/**
 * ヘッダー一覧を階層構造に変換する
 * 
 * @description
 * フラットなヘッダー配列を階層構造に変換します。
 * 目次の入れ子表示に使用できます。
 * 
 * @param headings - ヘッダー項目の配列
 * @returns 階層構造のヘッダーデータ
 */
export interface NestedHeading extends HeadingItem {
	/** 子ヘッダー */
	children: NestedHeading[];
}

export function createNestedHeadings(headings: HeadingItem[]): NestedHeading[] {
	const nested: NestedHeading[] = [];
	const stack: NestedHeading[] = [];

	for (const heading of headings) {
		const item: NestedHeading = {
			...heading,
			children: [],
		};

		// 現在のレベルより深いものをスタックから削除
		while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
			stack.pop();
		}

		// 親がある場合は親の子として追加、ない場合はルートに追加
		if (stack.length === 0) {
			nested.push(item);
		} else {
			stack[stack.length - 1].children.push(item);
		}

		stack.push(item);
	}

	return nested;
}