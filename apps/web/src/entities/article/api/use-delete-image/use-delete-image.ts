"use client";

import { useMutation } from "@tanstack/react-query";

/**
 * 画像削除のレスポンス型
 */
type DeleteImageResponse = {
	message: string;
};

/**
 * 画像削除のエラー型
 */
type DeleteImageError = {
	error: {
		code: string;
		message: string;
	};
};

/**
 * 汎用画像を削除するカスタムフック
 *
 * @description
 * 指定されたImage IDの画像をCloudflare Imagesから削除する。
 * 主に画像アップロード後に記事作成が失敗した場合のクリーンアップに使用する。
 *
 * 処理フロー:
 * 1. DELETE /api/images/:imageId にリクエスト
 * 2. Cloudflare Imagesから画像を削除
 * 3. レスポンスでmessageを受け取る
 *
 * @returns useMutationの戻り値
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteImage();
 *
 * const handleDelete = async (imageId: string) => {
 *   try {
 *     await deleteMutation.mutateAsync({ imageId });
 *     console.log("削除成功");
 *   } catch (error) {
 *     console.error("削除失敗:", error);
 *   }
 * };
 * ```
 */
export function useDeleteImage() {
	return useMutation<
		DeleteImageResponse,
		DeleteImageError,
		{ imageId: string }
	>({
		mutationFn: async ({ imageId }) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/images/${imageId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = (await response.json()) as DeleteImageError;
				throw errorData;
			}

			return response.json();
		},
	});
}
