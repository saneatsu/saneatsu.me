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
 * Cloudflare Imagesに画像をアップロードする
 *
 * @description
 * 画像ファイルをマルチパート形式でCloudflare Imagesにアップロードする。
 * Image IDは自動生成される（UUIDv4形式）。
 *
 * @param file - アップロードする画像ファイル
 * @param env - 環境変数（Account ID、API Token）
 * @returns アップロードされた画像のID
 * @throws Cloudflare Images APIからエラーが返された場合
 *
 * @example
 * const imageId = await uploadImage(file, env);
 * // imageId: "2cdc28f0-017a-49c4-9ed7-87056c83901f"
 */
export async function uploadImage(
	file: File,
	env: Pick<Env, "CLOUDFLARE_ACCOUNT_ID" | "CLOUDFLARE_IMAGES_TOKEN">
): Promise<{ imageId: string }> {
	const formData = new FormData();
	formData.append("file", file);

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

	return { imageId: data.result.id };
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
