import type { RouteHandler } from "@hono/zod-openapi";

import type { Env } from "@/env";
import {
	getDatabase,
	getImageUrl,
	translateGalleryImage,
	uploadImage,
} from "@/lib";

import type { uploadGalleryImageRoute } from "./upload-gallery-image.openapi";

type Handler = RouteHandler<typeof uploadGalleryImageRoute, { Bindings: Env }>;

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
 * POST /api/gallery/images - ギャラリー画像アップロード
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. multipart/form-dataからfile、titleJa、descriptionJa、latitude、longitude、takenAtを取得
 * 3. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
 * 4. ファイルサイズバリデーション（10MB以下）
 * 5. ファイル形式バリデーション（JPEG/PNG/GIF/WebP）
 * 6. 緯度・経度のバリデーション（オプショナル）
 * 7. Gemini APIで日本語テキストを英語に翻訳
 * 8. Cloudflare Imagesにアップロード（prefixは"gallery"）
 * 9. DBに画像情報を保存（gallery_images）
 * 10. 翻訳データを保存（日本語と英語の両方、gallery_image_translations）
 * 11. 画像URL（originalバリアント）を生成
 * 12. レスポンスを返す
 *
 * @remarks
 * **設計方針 - ImageIdPrefixについて:**
 *
 * このエンドポイントでアップロードされる画像は`prefix: "gallery"`で保存される。
 * ただし、gallery_imagesテーブルには"gallery-xxx"だけでなく"content-xxx"も
 * 保存可能な設計としている。これにより、記事内で使用した画像を後から
 * ギャラリーにも追加することが可能。
 *
 * 詳細は `apps/backend/src/lib/cloudflare-image-types/cloudflare-image-types.ts`
 * のImageIdPrefix型のコメントを参照。
 *
 * **設計方針 - 多言語対応について:**
 *
 * 画像のtitleとdescriptionは多言語対応のため、フロントエンドから日本語のみを受け取り、
 * Gemini APIで英語に翻訳してgallery_image_translationsテーブルに保存される。
 */
export const uploadGalleryImageHandler: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, galleryImages, galleryImageTranslations } =
			await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. multipart/form-dataからfile、titleJa、descriptionJa、latitude、longitude、takenAtを取得
		const body = await c.req.parseBody();
		const file = body.file;
		const titleJa = typeof body.titleJa === "string" ? body.titleJa : undefined;
		const descriptionJa =
			typeof body.descriptionJa === "string" ? body.descriptionJa : undefined;
		const latitudeStr =
			typeof body.latitude === "string" ? body.latitude : undefined;
		const longitudeStr =
			typeof body.longitude === "string" ? body.longitude : undefined;
		const takenAt = typeof body.takenAt === "string" ? body.takenAt : undefined;

		// 3. ファイルが存在しない、またはFileオブジェクトでない場合は400エラー
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

		// 4. ファイルサイズバリデーション（10MB以下）
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

		// 5. ファイル形式バリデーション（JPEG/PNG/GIF/WebP）
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

		// 6. タイトルまたは説明が必須
		if (!titleJa && !descriptionJa) {
			return c.json(
				{
					error: {
						code: "INVALID_REQUEST",
						message: "タイトルまたは説明のいずれかは必須です。",
					},
				},
				400
			);
		}

		// 7. 緯度・経度のバリデーション（オプショナル）
		let latitude: number | undefined;
		let longitude: number | undefined;

		if (latitudeStr !== undefined) {
			latitude = Number.parseFloat(latitudeStr);
			if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
				return c.json(
					{
						error: {
							code: "INVALID_LATITUDE",
							message: "緯度は-90から90の間の数値で指定してください。",
						},
					},
					400
				);
			}
		}

		if (longitudeStr !== undefined) {
			longitude = Number.parseFloat(longitudeStr);
			if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
				return c.json(
					{
						error: {
							code: "INVALID_LONGITUDE",
							message: "経度は-180から180の間の数値で指定してください。",
						},
					},
					400
				);
			}
		}

		// 7. Gemini APIで日本語テキストを英語に翻訳
		const translationResult = await translateGalleryImage(
			{
				titleJa,
				descriptionJa,
			},
			c.env.GEMINI_API_KEY
		);

		// 8. Cloudflare Imagesにアップロード（galleryプレフィックス付き、環境別（NODE_ENV））
		const { imageId } = await uploadImage(
			file,
			{
				CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
				CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
				NODE_ENV: c.env.NODE_ENV,
			},
			{ prefix: "gallery" }
		);

		// 8. DBに画像情報を保存（トランザクション）
		const now = new Date().toISOString();
		const [newGalleryImage] = await db
			.insert(galleryImages)
			.values({
				cfImageId: imageId,
				latitude: latitude || null,
				longitude: longitude || null,
				takenAt: takenAt || null,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		// 10. 翻訳データを保存（日本語と英語の両方）
		const translationsToInsert = [];

		// 日本語の翻訳データ
		if (translationResult.ja.title || translationResult.ja.description) {
			translationsToInsert.push({
				galleryImageId: newGalleryImage.id,
				language: "ja" as const,
				title: translationResult.ja.title,
				description: translationResult.ja.description,
				createdAt: now,
				updatedAt: now,
			});
		}

		// 英語の翻訳データ
		if (translationResult.en.title || translationResult.en.description) {
			translationsToInsert.push({
				galleryImageId: newGalleryImage.id,
				language: "en" as const,
				title: translationResult.en.title,
				description: translationResult.en.description,
				createdAt: now,
				updatedAt: now,
			});
		}

		if (translationsToInsert.length > 0) {
			await db.insert(galleryImageTranslations).values(translationsToInsert);
		}

		// 9. 画像URL（originalバリアント）を生成
		const imageUrl = getImageUrl(
			imageId,
			"original",
			c.env.CLOUDFLARE_ACCOUNT_HASH
		);

		// 10. レスポンスを返す
		return c.json(
			{
				id: newGalleryImage.id,
				imageId,
				imageUrl,
				message: "ギャラリー画像が正常にアップロードされました",
			},
			200
		);
	} catch (error) {
		console.error("Error uploading gallery image:", error);
		return c.json(
			{
				error: {
					code: "UPLOAD_FAILED",
					message: "ギャラリー画像のアップロードに失敗しました",
				},
			},
			500
		);
	}
};
