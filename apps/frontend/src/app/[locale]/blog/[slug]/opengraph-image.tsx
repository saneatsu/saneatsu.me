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
function _arrayBufferToBase64(buffer: ArrayBuffer): string {
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
 * Cloudflare Imagesから画像を取得してbase64 data URLに変換
 *
 * @description
 * 記事サムネイルをOG画像の背景に使うため、Cloudflare Imagesから画像を取得し、
 * base64エンコードしたdata URLに変換する。
 * Satori（next/og）で画像を正しくレンダリングするには、imgタグにwidth/height属性と
 * data URL形式の画像が必要なため、この関数でfetchしてbase64に変換する。
 * 失敗した場合は `null` を返して従来のグリッド背景のみ表示する。
 *
 * @param cfImageId - Cloudflare ImagesのID
 * @param variant - バリアント名（small/medium/large/xlarge）
 * @returns base64エンコードされたdata URL、または取得失敗時はnull
 */
async function fetchImageAsBase64(
	cfImageId: string | null,
	variant: string
): Promise<string | null> {
	console.log("🔍 Fetching image as base64");
	console.log("  - cfImageId:", cfImageId ?? "null");
	console.log("  - variant:", variant);

	const imageUrl = getCloudflareImageUrl(cfImageId, variant);

	console.log("🔍 Cloudflare Image URL:", imageUrl ?? "null");
	console.log("  - hasUrl:", !!imageUrl);

	if (!imageUrl) {
		console.warn("⚠️ No image URL generated (cfImageId may be null or invalid)");
		return null;
	}

	try {
		// 画像をfetch
		console.log("🔍 Fetching image from URL:", imageUrl);
		const response = await fetch(imageUrl);

		if (!response.ok) {
			console.error("❌ Failed to fetch image:", {
				status: response.status,
				statusText: response.statusText,
			});
			return null;
		}

		// ArrayBufferに変換
		const buffer = await response.arrayBuffer();
		console.log("✅ Image fetched successfully:", {
			size: buffer.byteLength,
			sizeKB: Math.round(buffer.byteLength / 1024),
		});

		// base64にエンコード
		const base64 = _arrayBufferToBase64(buffer);
		const dataUrl = `data:image/png;base64,${base64}`;

		console.log("✅ Base64 conversion complete:", {
			base64Length: base64.length,
			dataUrlLength: dataUrl.length,
		});

		return dataUrl;
	} catch (error) {
		console.error("❌ Error fetching or converting image:", error);
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

		console.log("🔍 OG Image Generation Debug");
		console.log("  - locale:", locale);
		console.log("  - slug:", slug);
		console.log("  - articleTitle:", article.title ?? "null");
		console.log("  - cfImageId:", article.cfImageId ?? "null");
		console.log("  - hasCfImageId:", !!article.cfImageId);

		// FIXME: titleはnullableじゃなくする
		const title = article.title || "Untitled";

		const backgroundImageDataUrl = await fetchImageAsBase64(
			article.cfImageId,
			"large"
		);

		console.log("🔍 Background Image Result");
		console.log("  - hasBackgroundImage:", !!backgroundImageDataUrl);
		if (backgroundImageDataUrl) {
			console.log(
				"  - backgroundImageDataUrlLength:",
				backgroundImageDataUrl.length
			);
		}

		return ArticleOgImage(title, backgroundImageDataUrl);
	} catch (error) {
		// 記事が見つからない場合はデフォルトの画像を生成
		console.error("❌ Failed to generate OG image");
		console.error(
			"  - errorName:",
			error instanceof Error ? error.name : "Unknown"
		);
		console.error(
			"  - errorMessage:",
			error instanceof Error ? error.message : String(error)
		);
		console.error("  - locale:", locale);
		console.error("  - slug:", slug);

		return SiteOgImage();
	}
}
