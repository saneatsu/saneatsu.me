/**
 * Markdown関連のユーティリティ関数
 */

/**
 * 見出し情報
 */
export interface MarkdownHeading {
	/** 見出しのレベル（1-6） */
	level: number;
	/** 見出しのテキスト */
	text: string;
	/** 見出しのID（URLアンカー用） */
	id: string;
}

/**
 * Markdownテキストから見出しを抽出する
 *
 * @description
 * 1. Markdownテキストから#, ##, ###で始まる見出しを検出
 * 2. 見出しレベルとテキストを抽出
 * 3. URLアンカー用のIDを生成
 *
 * @param content - Markdownコンテンツ
 * @param maxLevel - 抽出する最大見出しレベル（デフォルト: 3）
 * @returns 見出し情報の配列
 *
 * @example
 * const headings = extractHeadings("# Title\n## Section");
 * // [{ level: 1, text: "Title", id: "title" }, { level: 2, text: "Section", id: "section" }]
 */
export function extractHeadings(
	content: string,
	maxLevel = 3
): MarkdownHeading[] {
	const headings: MarkdownHeading[] = [];
	const headingRegex = new RegExp(`^(#{1,${maxLevel}})\\s+(.+)$`, "gm");

	let match: RegExpExecArray | null = headingRegex.exec(content);
	while (match !== null) {
		const level = match[1].length;
		const text = match[2].trim();

		// URLアンカー用のIDを生成（英数字とハイフンのみ）
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, "") // 特殊文字を削除
			.replace(/\s+/g, "-") // スペースをハイフンに
			.replace(/-+/g, "-") // 連続ハイフンを単一に
			.replace(/^-+|-+$/g, ""); // 先頭末尾のハイフンを削除

		headings.push({ level, text, id });

		// 次のマッチを取得
		match = headingRegex.exec(content);
	}

	return headings;
}

/**
 * テキストから最初の段落を抽出する（サマリー用）
 *
 * @param content - Markdownコンテンツ
 * @param maxLength - 最大文字数（デフォルト: 200）
 * @returns 最初の段落のテキスト
 */
export function extractFirstParagraph(
	content: string,
	maxLength = 200
): string {
	// 見出しやリストを除いた最初の段落を探す
	const paragraphMatch = content.match(/^(?!#|\*|-|\d+\.|\s*$)(.+)$/m);

	if (!paragraphMatch) {
		return "";
	}

	const paragraph = paragraphMatch[1].trim();

	// 最大文字数を超える場合は切り詰める
	if (paragraph.length > maxLength) {
		return `${paragraph.substring(0, maxLength)}...`;
	}

	return paragraph;
}
