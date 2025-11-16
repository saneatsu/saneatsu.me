import { fetchArticle, getCloudflareImageUrl } from "@/shared/lib";
import {
	OG_IMAGE_ALT,
	OG_IMAGE_CONTENT_TYPE,
	OG_IMAGE_SIZE,
} from "@/shared/ui";
import { ArticleOgImage, SiteOgImage } from "@/shared/ui/og-image/og-image";

/**
 * OGP画像のメタデータ
 */
export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

interface OgImageProps {
	params: Promise<{
		locale: string;
		slug: string;
	}>;
}

/**
 * ArrayBuffer -> base64 変換ユーティリティ
 *
 * @description
 * next/og の `ImageResponse` は Node/Edge runtime 上で動作するため、`btoa` などの
 * ブラウザAPIが常に使えるとは限らず、逆に `Buffer` がない環境も存在する。
 * そのため両方の環境で動作するように、Buffer があればそれを利用し、なければ
 * 手動で文字列化して base64 に変換する処理を提供する。
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	if (typeof Buffer !== "undefined") {
		return Buffer.from(buffer).toString("base64");
	}

	let binary = "";
	const bytes = new Uint8Array(buffer);
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode(...chunk);
	}

	return btoa(binary);
}

/**
 * Cloudflare Images のバリアントを data URL へ変換
 *
 * @description
 * next/og では `<img src="https://">` がサポートされず、背景として画像を利用する
 * には data URL で埋め込む必要がある。記事サムネイルをOG画像の背景に使うため、
 * Cloudflare Imagesから該当バリアントを取得しbase64へエンコードして返す。
 * 失敗した場合は `null` を返して従来のグリッド背景のみ表示する。
 */
async function getBackgroundImageDataUrl(
	cfImageId: string | null,
	variant: string
): Promise<string | null> {
	const imageUrl = getCloudflareImageUrl(cfImageId, variant);
	if (!imageUrl) {
		return null;
	}

	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			console.warn("⚠️ Failed to fetch Cloudflare image", response.status);
			return null;
		}

		const arrayBuffer = await response.arrayBuffer();
		const contentType = response.headers.get("content-type") || "image/jpeg";
		const base64 = arrayBufferToBase64(arrayBuffer);
		return `data:${contentType};base64,${base64}`;
	} catch (error) {
		console.error("Failed to load Cloudflare image", error);
		return null;
	}
}

/**
 * 記事ページ用のOG画像生成
 *
 * @description
 * 記事ページ（`/ja/blog/[slug]`, `/en/blog/[slug]`）のOGP画像を生成する。
 * 記事タイトルから動的に画像を生成し、SNSでシェアされた時に表示される。
 *
 * @param params - ページパラメータ（locale, slug）
 * @returns ImageResponse - 生成されたOG画像（記事タイトル + "saneatsu.me"）
 *
 * @remarks
 * 記事取得に失敗した場合は、デフォルトのサイトOG画像を返す。
 */
export default async function Image({ params }: OgImageProps) {
	const { locale, slug } = await params;

	try {
		// 記事データを取得
		const articleResponse = await fetchArticle(slug, {
			lang: locale as "ja" | "en",
		});
		const article = articleResponse.data;

		// FIXME: titleはnullableじゃなくする
		const title = article.title || "Untitled";

		const backgroundImageDataUrl = await getBackgroundImageDataUrl(
			article.cfImageId,
			"large"
		);

		return ArticleOgImage(title, backgroundImageDataUrl);
	} catch (error) {
		// 記事が見つからない場合はデフォルトの画像を生成
		console.error("Failed to generate OG image:", error);

		return SiteOgImage();
	}
}
