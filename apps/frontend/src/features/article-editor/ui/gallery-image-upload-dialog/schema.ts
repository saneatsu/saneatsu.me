import { z } from "zod";

/**
 * ギャラリー画像アップロードフォームのZodスキーマ
 *
 * @description
 * フォームバリデーションルール:
 * 1. file: 画像ファイル必須（jpg, jpeg, png, gif, webp）
 * 2. titleJa: 日本語タイトル必須（1-100文字）
 * 3. descriptionJa: 日本語説明（オプショナル、最大1000文字）
 * 4. latitude: 緯度（オプショナル、-90～90）
 * 5. longitude: 経度（オプショナル、-180～180）
 * 6. takenAt: 撮影日時（オプショナル、ISO 8601形式）
 */
export const galleryImageUploadSchema = z.object({
	/**
	 * 画像ファイル
	 */
	file: z
		.instanceof(File, { message: "画像ファイルを選択してください" })
		.refine((file) => file.size > 0, {
			message: "画像ファイルを選択してください",
		})
		.refine((file) => file.size <= 10 * 1024 * 1024, {
			message: "ファイルサイズは10MB以下にしてください",
		})
		.refine(
			(file) => {
				const validTypes = [
					"image/jpeg",
					"image/jpg",
					"image/png",
					"image/gif",
					"image/webp",
				];
				return validTypes.includes(file.type);
			},
			{
				message: "jpg, jpeg, png, gif, webp形式の画像のみアップロードできます",
			}
		),

	/**
	 * タイトル（日本語）
	 */
	titleJa: z
		.string()
		.min(1, { message: "タイトルを入力してください" })
		.max(100, { message: "タイトルは100文字以内で入力してください" }),

	/**
	 * 説明（日本語）
	 */
	descriptionJa: z
		.string()
		.max(1000, { message: "説明は1000文字以内で入力してください" })
		.optional(),

	/**
	 * 緯度
	 */
	latitude: z
		.number()
		.min(-90, { message: "緯度は-90から90の範囲で入力してください" })
		.max(90, { message: "緯度は-90から90の範囲で入力してください" })
		.optional(),

	/**
	 * 経度
	 */
	longitude: z
		.number()
		.min(-180, { message: "経度は-180から180の範囲で入力してください" })
		.max(180, { message: "経度は-180から180の範囲で入力してください" })
		.optional(),

	/**
	 * 撮影日時
	 */
	takenAt: z
		.string()
		.datetime({ message: "撮影日時は日時形式で入力してください" })
		.optional(),
});

/**
 * ギャラリー画像アップロードフォームの型
 */
export type GalleryImageUploadFormValues = z.infer<
	typeof galleryImageUploadSchema
>;
