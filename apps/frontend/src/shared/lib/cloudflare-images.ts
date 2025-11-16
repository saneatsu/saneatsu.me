import { env } from "@/env";

/**
 * Cloudflare Images URL生成ユーティリティ
 *
 * @description
 * Cloudflare ImagesのURLを生成するためのユーティリティ関数。
 * アカウントハッシュは環境変数から取得する。
 */

/**
 * Cloudflare Imagesのアカウントハッシュを取得する
 *
 * @description
 * 環境変数からCloudflare Imagesのアカウントハッシュを取得する。
 *
 * @returns Cloudflare Imagesのアカウントハッシュ
 */
function getCloudflareAccountHash(): string {
	return env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
}

/**
 * Cloudflare Images URLを生成する
 *
 * @description
 * Cloudflare Images IDから画像URLを生成する。
 * variantは画像の変換設定を指定する（例: public, thumbnail, avatar など）。
 *
 * @param imageId - Cloudflare Images ID
 * @param variant - 画像のバリアント（デフォルト: "public"）
 * @returns 画像の完全なURL
 *
 * @example
 * ```ts
 * const imageUrl = getCloudflareImageUrl("abc123", "public");
 * // => "https://imagedelivery.net/<account-hash>/abc123/public"
 * ```
 */
export function getCloudflareImageUrl(
	imageId: string | null | undefined,
	variant = "public"
): string | null {
	if (!imageId) {
		return null;
	}

	const accountHash = getCloudflareAccountHash();
	return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

/**
 * OGP用の画像URLを取得する
 *
 * @description
 * OGP用の画像URLを取得する。
 * Cloudflare Images IDの有無にかかわらず、記事固有のOGP生成エンドポイントを返す。
 * サムネイルがある場合は、動的OG画像の背景として `large` バリアントを使用し、
 * ない場合は従来のグリッド背景のみの画像が生成される。
 *
 * @param imageId - Cloudflare Images ID（オプショナル）
 * @param locale - ロケール（例: "ja", "en"）
 * @param slug - 記事のslug
 * @param baseUrl - サイトのベースURL（デフォルト: "https://saneatsu.me"）
 * @returns OGP用の画像URL
 *
 * @example
 * ```ts
 * const ogImageUrl = getOgImageUrl("abc123", "ja", "article-001");
 * // => "https://imagedelivery.net/<account-hash>/abc123/large"
 *
 * const defaultOgImageUrl = getOgImageUrl(null, "ja", "article-001");
 * // => "https://saneatsu.me/ja/blog/article-001/opengraph-image"
 * ```
 */
export function getOgImageUrl(
	_imageId: string | null | undefined,
	locale: string,
	slug: string,
	baseUrl = "https://saneatsu.me"
): string {
	return `${baseUrl}/${locale}/blog/${slug}/opengraph-image`;
}
