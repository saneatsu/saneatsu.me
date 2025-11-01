import type { ImageVariant } from "@saneatsu/schemas";

import { env } from "@/env";

/**
 * Cloudflare Images URLを生成する
 *
 * @description
 * 画像IDとVariantから、Cloudflare ImagesのCDN URLを生成する。
 * 環境変数`NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH`を使用する。
 *
 * @param imageId - Cloudflare Imagesの画像ID
 * @param variant - 画像のVariant（small, medium, large, xlarge）
 * @returns Cloudflare Images CDN URL
 *
 * @example
 * ```tsx
 * const mediumUrl = getImageUrl('my-image-id', 'medium');
 * // => "https://imagedelivery.net/{hash}/my-image-id/medium"
 *
 * const xlargeUrl = getImageUrl('my-image-id', 'xlarge');
 * // => "https://imagedelivery.net/{hash}/my-image-id/xlarge"
 * ```
 */
export function getImageUrl(imageId: string, variant: ImageVariant): string {
	const accountHash = env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
	return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

/**
 * Cloudflare Images URLから画像IDを抽出する
 *
 * @description
 * `https://imagedelivery.net/{hash}/{imageId}/{variant}`形式のURLから画像IDを抽出する。
 *
 * @param url - Cloudflare Images URL
 * @returns 画像ID、抽出できない場合はnull
 *
 * @example
 * ```tsx
 * const imageId = extractImageId('https://imagedelivery.net/abc123/my-image-id/medium');
 * // => "my-image-id"
 * ```
 */
export function extractImageId(url: string): string | null {
	const match = url.match(/imagedelivery\.net\/[^/]+\/([^/]+)\//);
	return match ? match[1] : null;
}
