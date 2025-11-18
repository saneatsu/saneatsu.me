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
 * Cloudflare Imagesから画像をfetchしてArrayBufferに変換
 *
 * @description
 * 記事サムネイルをOG画像の背景に使うため、Cloudflare Imagesから画像を取得し、
 * ArrayBufferに変換する。Satori（next/og）で画像を正しくレンダリングするには、
 * 直接URLではなくArrayBufferを渡す必要がある。
 *
 * User-Agentヘッダーを追加することで、Cloudflare Imagesの403エラーを回避する。
 * 失敗した場合は `null` を返して従来のグリッド背景のみ表示する。
 *
 * @param cfImageId - Cloudflare ImagesのID
 * @param variant - バリアント名（small/medium/large/xlarge）
 * @returns ArrayBuffer、または取得失敗時はnull
 */
async function fetchImageAsArrayBuffer(
	cfImageId: string | null,
	variant: string
): Promise<ArrayBuffer | null> {
	console.log("🔍 Fetching image as ArrayBuffer");
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
		// 画像をfetch（User-Agentヘッダーを追加してCloudflare Imagesの403エラーを回避）
		console.log("🔍 Fetching image from URL:", imageUrl);
		const response = await fetch(imageUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; OGImageBot/1.0)",
			},
			// Cloudflare Workersでキャッシュを活用
			cache: "force-cache",
		});

		if (!response.ok) {
			console.error("❌ Failed to fetch image:", {
				status: response.status,
				statusText: response.statusText,
			});
			return null;
		}

		// Content-Typeをチェック（JPG/PNGのみ）
		const contentType = response.headers.get("content-type");
		if (!contentType?.startsWith("image/")) {
			console.error("❌ Invalid content type:", contentType);
			return null;
		}

		// ArrayBufferに変換
		const buffer = await response.arrayBuffer();
		console.log("✅ Image fetched successfully:", {
			size: buffer.byteLength,
			sizeKB: Math.round(buffer.byteLength / 1024),
			contentType,
		});

		return buffer;
	} catch (error) {
		console.error("❌ Error fetching image:", error);
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

		const backgroundImageData = await fetchImageAsArrayBuffer(
			article.cfImageId,
			"large"
		);

		console.log("🔍 Background Image Result");
		console.log("  - hasBackgroundImage:", !!backgroundImageData);
		if (backgroundImageData) {
			console.log("  - backgroundImageSize:", backgroundImageData.byteLength);
			console.log(
				"  - backgroundImageSizeKB:",
				Math.round(backgroundImageData.byteLength / 1024)
			);
		}

		return ArticleOgImage(title, backgroundImageData);
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
