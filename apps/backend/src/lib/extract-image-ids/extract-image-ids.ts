/**
 * Markdownテキストから Cloudflare Images の画像IDを抽出する
 *
 * @description
 * Markdown内の画像URLから Cloudflare Images のimageIdを抽出する。
 * 以下のURL形式に対応：
 * - https://imagedelivery.net/{accountHash}/{imageId}/{variant}
 *
 * @param markdown - 画像IDを抽出するMarkdownテキスト
 * @returns 抽出された画像IDの配列（重複なし）
 *
 * @example
 * const markdown = `
 * ![画像1](https://imagedelivery.net/abc123/test-image-id-1/medium)
 * ![画像2](https://imagedelivery.net/abc123/test-image-id-2/medium)
 * `;
 * const imageIds = extractImageIdsFromMarkdown(markdown);
 * // imageIds: ["test-image-id-1", "test-image-id-2"]
 */
export function extractImageIdsFromMarkdown(markdown: string): string[] {
	// Cloudflare Images URLの正規表現
	// https://imagedelivery.net/{accountHash}/{imageId}/{variant}
	const regex = /https:\/\/imagedelivery\.net\/[^/]+\/([^/]+)\//g;

	const matches = [...markdown.matchAll(regex)];

	// 画像IDを抽出し、重複を除去
	const imageIds = matches.map((match) => match[1]);
	return Array.from(new Set(imageIds));
}
