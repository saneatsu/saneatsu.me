import {
	OG_IMAGE_ALT,
	OG_IMAGE_CONTENT_TYPE,
	OG_IMAGE_SIZE,
} from "@/shared/ui";

/**
 * OGP画像のメタデータ
 */
export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

/**
 * ホームページ用のOG画像生成
 *
 * @description
 * ホームページ（`/ja`, `/en`）のOGP画像を生成する。
 * SNSでシェアされた際に表示される画像。
 *
 * @returns ImageResponse - 生成されたOG画像（"saneatsu.me" + "Tech & Lifestyle Blog"）
 */
export { SiteOgImage as default } from "@/shared/ui";
