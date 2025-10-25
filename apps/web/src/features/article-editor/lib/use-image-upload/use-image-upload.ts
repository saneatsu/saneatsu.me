import { useState } from "react";
import { toast } from "sonner";

import { honoClient } from "@/shared/lib";

/**
 * 画像アップロードの結果
 */
export interface ImageUploadResult {
	/** Cloudflare Images ID */
	imageId: string;
	/** 画像URL（mediumバリアント） */
	imageUrl: string;
	/** Markdown形式の画像挿入テキスト */
	markdown: string;
}

/**
 * 画像アップロードフック
 *
 * @description
 * 画像をCloudflare Imagesにアップロードし、Markdown形式の画像リンクを生成する。
 *
 * 機能：
 * 1. ファイルをPOST /api/imagesでアップロード
 * 2. ローディング状態の管理
 * 3. エラーハンドリングとトースト通知
 * 4. Markdown形式のテキスト生成
 *
 * @example
 * ```tsx
 * const { uploadImage, isUploading, error } = useImageUpload();
 *
 * const handleFileSelect = async (file: File) => {
 *   const result = await uploadImage(file);
 *   if (result) {
 *     // result.markdown を使ってエディタに挿入
 *   }
 * };
 * ```
 */
export function useImageUpload() {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 画像をアップロードする
	 *
	 * @param file - アップロードするファイル
	 * @returns アップロード結果（失敗時はnull）
	 */
	const uploadImage = async (file: File): Promise<ImageUploadResult | null> => {
		setIsUploading(true);
		setError(null);

		try {
			// APIリクエスト（Hono RPCでmultipart/form-dataを送信）
			const response = await honoClient.api.images.$post({
				form: {
					file: file,
				},
			});

			if (!response.ok) {
				const errorData = (await response.json()) as {
					error: { code: string; message: string };
				};
				throw new Error(
					errorData.error.message || "画像のアップロードに失敗しました"
				);
			}

			const data = await response.json();

			// Markdown形式のテキストを生成
			// ファイル名から拡張子を除いたものをalt textとして使用
			const altText = file.name.replace(/\.[^/.]+$/, "");
			const markdown = `![${altText}](${data.imageUrl})`;

			toast.success("画像をアップロードしました");

			return {
				imageId: data.imageId,
				imageUrl: data.imageUrl,
				markdown,
			};
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "画像のアップロードに失敗しました";
			setError(errorMessage);
			toast.error(errorMessage);
			return null;
		} finally {
			setIsUploading(false);
		}
	};

	return {
		uploadImage,
		isUploading,
		error,
	};
}
