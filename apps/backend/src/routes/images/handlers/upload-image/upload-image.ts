import type { RouteHandler } from "@hono/zod-openapi";

import { getImageUrl, uploadImage } from "@/lib";
import type { Env } from "@/types/env";

import type { uploadImageRoute } from "./upload-image.openapi";

type Handler = RouteHandler<typeof uploadImageRoute, { Bindings: Env }>;

/**
 * 許可される画像MIMEタイプ
 */
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
] as const;

/**
 * 最大ファイルサイズ（10MB）
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/images - 汎用画像アップロード
 *
 * @description
 * 処理フロー:
 * 1. multipart/form-dataからfileを取得
 * 2. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
 * 3. ファイルサイズバリデーション（10MB以下）
 * 4. ファイル形式バリデーション（JPEG/PNG/GIF/WebP）
 * 5. Cloudflare Imagesにアップロード
 * 6. 画像URL（mediumバリアント）を生成
 * 7. レスポンスを返す
 */
export const uploadImageHandler: Handler = async (c) => {
	try {
		// 1. multipart/form-dataからfileを取得
		const body = await c.req.parseBody();
		const file = body.file;

		// 2. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
		if (!file || !(file instanceof File)) {
			return c.json(
				{
					error: {
						code: "INVALID_REQUEST",
						message:
							"ファイルが指定されていません。multipart/form-dataでfileフィールドに画像を指定してください。",
					},
				},
				400
			);
		}

		// 3. ファイルサイズバリデーション（10MB以下）
		if (file.size > MAX_FILE_SIZE) {
			return c.json(
				{
					error: {
						code: "FILE_TOO_LARGE",
						message: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでアップロードできます。`,
					},
				},
				400
			);
		}

		// 4. ファイル形式バリデーション（JPEG/PNG/GIF/WebP）
		if (
			!ALLOWED_MIME_TYPES.includes(
				file.type as (typeof ALLOWED_MIME_TYPES)[number]
			)
		) {
			return c.json(
				{
					error: {
						code: "INVALID_FILE_TYPE",
						message: `許可されていないファイル形式です。JPEG、PNG、GIF、WebP形式のみアップロードできます。（受信: ${file.type}）`,
					},
				},
				400
			);
		}

		// 5. Cloudflare Imagesにアップロード（contentプレフィックス付き）
		const { imageId } = await uploadImage(
			file,
			{
				CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
				CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
			},
			{ prefix: "content" }
		);

		// 6. 画像URL（mediumバリアント）を生成
		const imageUrl = getImageUrl(
			imageId,
			"medium",
			c.env.CLOUDFLARE_ACCOUNT_HASH
		);

		// 7. レスポンスを返す
		return c.json(
			{
				imageId,
				imageUrl,
				message: "画像が正常にアップロードされました",
			},
			200
		);
	} catch (error) {
		console.error("Error uploading image:", error);
		return c.json(
			{
				error: {
					code: "UPLOAD_FAILED",
					message: "画像のアップロードに失敗しました",
				},
			},
			500
		);
	}
};
