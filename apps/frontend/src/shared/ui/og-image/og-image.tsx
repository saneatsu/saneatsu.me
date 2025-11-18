import { ImageResponse } from "next/og";

import { OG_IMAGE_SIZE } from "./og-image-constants";
import { ArticleOgImageContent, SiteOgImageContent } from "./og-image-view";

/**
 * サイト用のOG画像を生成
 */
export function SiteOgImage() {
	return new ImageResponse(<SiteOgImageContent />, {
		...OG_IMAGE_SIZE,
	});
}

/**
 * 記事用OG画像を生成
 */
export function ArticleOgImage(
	title: string,
	backgroundImage?: ArrayBuffer | null
) {
	return new ImageResponse(
		<ArticleOgImageContent title={title} backgroundImage={backgroundImage} />,
		{
			...OG_IMAGE_SIZE,
		}
	);
}
