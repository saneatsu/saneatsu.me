/**
 * MarkdownコンテンツからCloudflare Imagesのギャラリー画像IDを抽出する
 *
 * @description
 * 処理フロー:
 * 1. Markdown画像構文 `![alt](URL)` から Cloudflare Images の URL を抽出
 * 2. URL から cfImageId を抽出
 * 3. 重複を除去して返す
 *
 * @param markdown - 解析対象のMarkdownコンテンツ
 * @returns Cloudflare Images IDの配列（重複なし）
 *
 * @example
 * ```typescript
 * const markdown = `
 * ![Tokyo Tower](https://imagedelivery.net/xxx/gallery-tokyo-tower/xlarge)
 * ![Content Image](https://imagedelivery.net/xxx/content-image/large)
 * `;
 * const ids = extractGalleryCfImageIds(markdown);
 * // => ["gallery-tokyo-tower", "content-image"]
 * ```
 *
 * @remarks
 * - Markdown画像構文のみを対象とし、コードブロック内のURLは除外される
 * - 全てのCloudflare Images IDを抽出し、プレフィックスによるフィルタリングは行わない
 * - gallery_imagesテーブルとのJOINクエリで自動的にフィルタリングされる
 * - 同じIDが複数回使用されている場合は重複を除去する
 */
export function extractGalleryCfImageIds(markdown: string): string[] {
	// 1. Markdown画像構文から Cloudflare Images の cfImageId を抽出
	// 正規表現: ![...](https://imagedelivery.net/{accountHash}/{cfImageId}/{variant})
	const regex = /!\[.*?\]\(https:\/\/imagedelivery\.net\/[^/]+\/([^/]+)\//g;
	const matches = [...markdown.matchAll(regex)];

	// 2. cfImageId を抽出
	const cfImageIds = matches.map((match) => match[1]);

	// 3. 重複を除去して返す
	return Array.from(new Set(cfImageIds));
}
