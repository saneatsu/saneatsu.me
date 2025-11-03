/**
 * Markdownテキストをプレーンテキストに変換する
 *
 * @description
 * OGP用の説明文を生成するため、Markdownの記法を除去してプレーンテキストに変換する。
 * 改行、コードブロック、リンク、画像などのMarkdown記法を適切に処理する。
 *
 * @param markdown - 変換元のMarkdownテキスト
 * @returns プレーンテキスト
 *
 * @example
 * ```ts
 * const markdown = "# Title\n\nThis is **bold** text.";
 * const plainText = markdownToPlainText(markdown);
 * // => "Title This is bold text."
 * ```
 */
export function markdownToPlainText(markdown: string): string {
	let text = markdown;

	// コードブロックを除去
	text = text.replace(/```[\s\S]*?```/g, "");
	text = text.replace(/`[^`]+`/g, "");

	// 見出し記号を除去
	text = text.replace(/^#{1,6}\s+/gm, "");

	// 画像を除去
	text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

	// リンクをテキストのみに変換
	text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

	// Wiki Linkをテキストのみに変換
	text = text.replace(
		/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
		(_match, target, alias) => {
			return alias || target;
		}
	);

	// 太字・斜体を除去
	text = text.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
	text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
	text = text.replace(/\*([^*]+)\*/g, "$1");
	text = text.replace(/___([^_]+)___/g, "$1");
	text = text.replace(/__([^_]+)__/g, "$1");
	text = text.replace(/_([^_]+)_/g, "$1");

	// 打ち消し線を除去
	text = text.replace(/~~([^~]+)~~/g, "$1");

	// 引用符を除去
	text = text.replace(/^>\s+/gm, "");

	// リスト記号を除去
	text = text.replace(/^[-*+]\s+/gm, "");
	text = text.replace(/^\d+\.\s+/gm, "");

	// 水平線を除去
	text = text.replace(/^[-*_]{3,}$/gm, "");

	// HTMLタグを除去
	text = text.replace(/<[^>]+>/g, "");

	// 連続する空白を1つに
	text = text.replace(/\s+/g, " ");

	// 前後の空白を除去
	text = text.trim();

	return text;
}

/**
 * Markdownテキストから指定文字数の説明文を抽出する
 *
 * @description
 * OGPのdescriptionとして使用するため、Markdownから指定文字数のプレーンテキストを抽出する。
 * 途中で切れる場合は「...」を追加する。
 *
 * @param markdown - 変換元のMarkdownテキスト
 * @param maxLength - 最大文字数（デフォルト: 160）
 * @returns 抽出されたプレーンテキスト
 *
 * @example
 * ```ts
 * const markdown = "# Title\n\nThis is a very long article...";
 * const description = extractDescription(markdown, 50);
 * // => "Title This is a very long article..."
 * ```
 */
export function extractDescription(markdown: string, maxLength = 160): string {
	const plainText = markdownToPlainText(markdown);

	if (plainText.length <= maxLength) {
		return plainText;
	}

	// maxLengthで切り詰めて、最後の完全な単語の位置を探す
	const truncated = plainText.slice(0, maxLength);
	const lastSpaceIndex = truncated.lastIndexOf(" ");

	// 空白が見つかった場合はそこで切り詰め、見つからなければmaxLengthで切る
	const finalText =
		lastSpaceIndex > 0 ? truncated.slice(0, lastSpaceIndex) : truncated;

	return `${finalText}...`;
}
