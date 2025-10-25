import {
	type CustomImageId,
	createCustomImageId,
	type ImageIdPrefix,
	isCustomImageId,
} from "@/lib/cloudflare-image-types/cloudflare-image-types";
import type { Env } from "@/types/env";

/**
 * Cloudflare Images APIのレスポンス型
 */
type CloudflareImagesUploadResponse = {
	result: {
		id: string;
		filename: string;
		uploaded: string;
		requireSignedURLs: boolean;
		variants: string[];
	};
	success: boolean;
	errors: Array<{ code: number; message: string }>;
	messages: string[];
};

type CloudflareImagesDeleteResponse = {
	result: Record<string, never>;
	success: boolean;
	errors: Array<{ code: number; message: string }>;
	messages: string[];
};

/**
 * Cloudflare Imagesに画像をアップロードする（カスタムIDあり）
 *
 * @description
 * 画像ファイルをマルチパート形式でCloudflare Imagesにアップロードする。
 * prefixを指定すると、カスタムImage ID形式（saneatsu-me_<prefix>_<uuid>）で生成される。
 *
 * @param file - アップロードする画像ファイル
 * @param env - 環境変数（Account ID、API Token）
 * @param options - アップロードオプション（prefix必須）
 * @returns アップロードされた画像のカスタムID
 * @throws Cloudflare Images APIからエラーが返された場合
 *
 * @example
 * const result = await uploadImage(file, env, { prefix: "thumbnail" });
 * // result.imageId: "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 */
export async function uploadImage(
	file: File,
	env: Pick<Env, "CLOUDFLARE_ACCOUNT_ID" | "CLOUDFLARE_IMAGES_TOKEN">,
	options: { prefix: ImageIdPrefix }
): Promise<{ imageId: CustomImageId }>;

/**
 * Cloudflare Imagesに画像をアップロードする（自動生成ID）
 *
 * @description
 * 画像ファイルをマルチパート形式でCloudflare Imagesにアップロードする。
 * Image IDは自動生成される（UUIDv4形式）。
 *
 * @param file - アップロードする画像ファイル
 * @param env - 環境変数（Account ID、API Token）
 * @param options - アップロードオプション（省略可）
 * @returns アップロードされた画像のID
 * @throws Cloudflare Images APIからエラーが返された場合
 *
 * @example
 * const result = await uploadImage(file, env);
 * // result.imageId: "2cdc28f0-017a-49c4-9ed7-87056c83901f"
 */
export async function uploadImage(
	file: File,
	env: Pick<Env, "CLOUDFLARE_ACCOUNT_ID" | "CLOUDFLARE_IMAGES_TOKEN">,
	options?: { prefix?: never }
): Promise<{ imageId: string }>;

/**
 * Cloudflare Imagesに画像をアップロードする（実装）
 *
 * @description
 * 処理フロー:
 * 1. FormDataを作成してファイルを追加
 * 2. prefixが指定されている場合、カスタムImage IDを生成してFormDataに追加
 * 3. Cloudflare Images APIにPOSTリクエスト
 * 4. レスポンスのエラーチェック
 * 5. prefixが指定されている場合、レスポンスのImage IDがCustomImageId形式かチェック
 * 6. Image IDを返す
 */
export async function uploadImage(
	file: File,
	env: Pick<Env, "CLOUDFLARE_ACCOUNT_ID" | "CLOUDFLARE_IMAGES_TOKEN">,
	options?: { prefix?: ImageIdPrefix }
): Promise<{ imageId: string } | { imageId: CustomImageId }> {
	// 1. FormDataを作成してファイルを追加
	const formData = new FormData();
	formData.append("file", file);

	// 2. prefixが指定されている場合、カスタムImage IDを生成してFormDataに追加
	if (options?.prefix) {
		const customId = createCustomImageId(options.prefix);
		formData.append("id", customId);
	}

	// 3. Cloudflare Images APIにPOSTリクエスト
	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_TOKEN}`,
			},
			body: formData,
		}
	);

	// 4. レスポンスのエラーチェック
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Cloudflare Images upload failed: ${response.status} ${errorText}`
		);
	}

	const data = (await response.json()) as CloudflareImagesUploadResponse;

	if (!data.success) {
		const errorMessage =
			data.errors.map((e) => e.message).join(", ") || "Unknown error";
		throw new Error(`Cloudflare Images upload failed: ${errorMessage}`);
	}

	const imageId = data.result.id;

	// 5. prefixが指定されている場合、レスポンスのImage IDがCustomImageId形式かチェック
	if (options?.prefix) {
		if (!isCustomImageId(imageId)) {
			throw new Error(`Expected CustomImageId format but received: ${imageId}`);
		}
		// 6. この時点でimageIdはCustomImageId型として保証される
		return { imageId };
	}

	// 6. この時点でimageIdはstring型
	return { imageId };
}

/**
 * Cloudflare Imagesから画像を削除する
 *
 * @description
 * 指定されたImage IDの画像をCloudflare Imagesから削除する。
 * 削除された画像はすべてのVariantsを含めて完全に削除される。
 *
 * @param imageId - 削除する画像のID
 * @param env - 環境変数（Account ID、API Token）
 * @returns 削除成功フラグ
 * @throws Cloudflare Images APIからエラーが返された場合
 *
 * @example
 * const result = await deleteImage("2cdc28f0-017a-49c4-9ed7-87056c83901f", env);
 * // result: { success: true }
 */
export async function deleteImage(
	imageId: string,
	env: Pick<Env, "CLOUDFLARE_ACCOUNT_ID" | "CLOUDFLARE_IMAGES_TOKEN">
): Promise<{ success: boolean }> {
	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_TOKEN}`,
			},
		}
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Cloudflare Images delete failed: ${response.status} ${errorText}`
		);
	}

	const data = (await response.json()) as CloudflareImagesDeleteResponse;

	if (!data.success) {
		const errorMessage =
			data.errors.map((e) => e.message).join(", ") || "Unknown error";
		throw new Error(`Cloudflare Images delete failed: ${errorMessage}`);
	}

	return { success: true };
}

/**
 * Cloudflare Images配信URLを生成する
 *
 * @description
 * Image IDとVariant名から画像配信URLを生成する。
 * このURLは公開アクセス可能で、CDNでキャッシュされる。
 *
 * @param imageId - 画像ID
 * @param variant - Variant名（small, medium, large, xlarge）
 * @param accountHash - Cloudflare Account Hash
 * @returns 画像配信URL
 *
 * @example
 * const url = getImageUrl("2cdc28f0-017a-49c4-9ed7-87056c83901f", "medium", "abc123");
 * // url: "https://imagedelivery.net/abc123/2cdc28f0-017a-49c4-9ed7-87056c83901f/medium"
 */
export function getImageUrl(
	imageId: string,
	variant: "small" | "medium" | "large" | "xlarge",
	accountHash: string
): string {
	return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}
