"use client";

import { useMutation } from "@tanstack/react-query";

/**
 * 画像アップロードのレスポンス型
 */
type UploadImageResponse = {
	imageId: string;
	imageUrl: string;
	message: string;
};

/**
 * 画像アップロードのエラー型
 */
export type UploadImageError = {
	error: {
		code: string;
		message: string;
	};
};

/**
 * 汎用画像をアップロードするカスタムフック
 *
 * @description
 * 記事IDなしで画像をアップロードする。
 * multipart/form-dataでfileフィールドに画像ファイルを送信する。
 * 記事新規作成時にサムネイルをアップロードするために使用する。
 *
 * 処理フロー:
 * 1. FormDataを作成してfileフィールドに画像ファイルを設定
 * 2. POST /api/images にリクエスト
 * 3. レスポンスでimageId、imageUrl、messageを受け取る
 *
 * @returns useMutationの戻り値
 *
 * @example
 * ```tsx
 * const uploadMutation = useUploadImage();
 *
 * const handleUpload = async (file: File) => {
 *   try {
 *     const result = await uploadMutation.mutateAsync({ file });
 *     console.log("アップロード成功:", result.imageId);
 *   } catch (error) {
 *     console.error("アップロード失敗:", error);
 *   }
 * };
 * ```
 */
export function useUploadImage() {
	return useMutation<UploadImageResponse, UploadImageError, { file: File }>({
		mutationFn: async ({ file }) => {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/images`,
				{
					method: "POST",
					body: formData,
				}
			);

			if (!response.ok) {
				const errorData = (await response.json()) as UploadImageError;
				throw errorData;
			}

			return response.json();
		},
	});
}
