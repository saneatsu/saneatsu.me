/**
 * MarkdownテキストからCloudflare Imagesのギャラリー画像IDを抽出する
 *
 * @description
 * Markdown内の画像URLからCloudflare ImagesのギャラリーimageIdを抽出する。
 * 以下のURL形式に対応し、`gallery-`で始まるIDのみを抽出：
 * - https://imagedelivery.net/{accountHash}/{imageId}/{variant}
 *
 * @param markdown - 画像IDを抽出するMarkdownテキスト
 * @returns 抽出されたギャラリー画像IDの配列（重複なし）
 *
 * @example
 * ```typescript
 * const markdown = `
 * ![ギャラリー画像](https://imagedelivery.net/abc123/gallery-image-1/medium)
 * ![記事画像](https://imagedelivery.net/abc123/content-image-2/medium)
 * ![ギャラリー画像](https://imagedelivery.net/abc123/gallery-image-1/large)
 * `;
 * const imageIds = extractGalleryImageIds(markdown);
 * // imageIds: ["gallery-image-1"]
 * // "content-image-2"は除外され、重複も除去される
 * ```
 */
export function extractGalleryImageIds(markdown: string): string[] {
	// Cloudflare Images URLの正規表現
	// https://imagedelivery.net/{accountHash}/{imageId}/{variant}
	const regex = /https:\/\/imagedelivery\.net\/[^/]+\/([^/]+)\//g;

	const matches = [...markdown.matchAll(regex)];

	// 画像IDを抽出し、"gallery-"で始まるもののみをフィルタリング
	const imageIds = matches
		.map((match) => match[1])
		.filter((id) => id.startsWith("gallery-"));

	// 重複を除去
	return Array.from(new Set(imageIds));
}
