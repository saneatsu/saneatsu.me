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

		const backgroundImageUrl = getCloudflareImageUrl(
			article.cfImageId,
			"large"
		);

		return ArticleOgImage(title, backgroundImageUrl);
	} catch (error) {
		// 記事が見つからない場合はデフォルトの画像を生成
		console.error("Failed to generate OG image:", error);

		return SiteOgImage();
	}
}
