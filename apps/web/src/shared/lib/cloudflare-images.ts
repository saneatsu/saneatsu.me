/**
 * Cloudflare Images URL生成ユーティリティ
 *
 * @description
 * Cloudflare ImagesのURLを生成するためのユーティリティ関数。
 * アカウントハッシュは環境変数から取得する。
 */

/**
 * Cloudflare Imagesのアカウントハッシュをチェックする
 *
 * @description
 * 環境変数からCloudflare Imagesのアカウントハッシュを取得する。
 * 設定されていない場合は警告を出力し、プレースホルダーを返す。
 *
 * @returns Cloudflare Imagesのアカウントハッシュ
 */
function getCloudflareAccountHash(): string {
	const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;

	if (!accountHash) {
		console.warn(
			"⚠️ NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH is not set. Using placeholder."
		);
		return "placeholder";
	}

	return accountHash;
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
 * Cloudflare Images IDがある場合はそのURLを、ない場合はデフォルトのOGP画像URLを返す。
 * OGPに最適化された1200x630pxのバリアントを使用する。
 *
 * @param imageId - Cloudflare Images ID（オプショナル）
 * @param baseUrl - サイトのベースURL（デフォルト: "https://saneatsu.me"）
 * @returns OGP用の画像URL
 *
 * @example
 * ```ts
 * const ogImageUrl = getOgImageUrl("abc123");
 * // => "https://imagedelivery.net/<account-hash>/abc123/ogp"
 *
 * const defaultOgImageUrl = getOgImageUrl(null);
 * // => "https://saneatsu.me/og-image.png"
 * ```
 */
export function getOgImageUrl(
	imageId: string | null | undefined,
	baseUrl = "https://saneatsu.me"
): string {
	if (imageId) {
		// Cloudflare Imagesを使用する場合は "ogp" バリアントを使用
		// 1200x630pxに最適化された画像を返す
		const imageUrl = getCloudflareImageUrl(imageId, "ogp");
		if (imageUrl) {
			return imageUrl;
		}
	}

	// デフォルトのOGP画像を返す
	return `${baseUrl}/og-image.png`;
}
