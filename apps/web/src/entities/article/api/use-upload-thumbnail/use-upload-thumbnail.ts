import { useMutation } from "@tanstack/react-query";

/**
 * サムネイル画像アップロードのレスポンス型
 */
export type UploadThumbnailResponse = {
	imageId: string;
	imageUrl: string;
	message: string;
};

/**
 * サムネイル画像アップロードのエラー型
 */
export type UploadThumbnailError = {
	error: {
		code: string;
		message: string;
	};
};

/**
 * サムネイル画像をアップロードするカスタムフック
 *
 * @description
 * 指定された記事IDに対してサムネイル画像をアップロードする。
 * multipart/form-dataでfileフィールドに画像ファイルを送信する。
 *
 * 処理フロー:
 * 1. FormDataを作成してfileフィールドに画像ファイルを設定
 * 2. POST /api/articles/:id/thumbnail にリクエスト
 * 3. レスポンスでimageId、imageUrl、messageを受け取る
 *
 * @returns useMutationの戻り値
 *
 * @example
 * const uploadMutation = useUploadThumbnail();
 *
 * const handleUpload = async (articleId: number, file: File) => {
 *   try {
 *     const result = await uploadMutation.mutateAsync({ articleId, file });
 *     console.log("アップロード成功:", result.imageUrl);
 *   } catch (error) {
 *     console.error("アップロード失敗:", error);
 *   }
 * };
 */
export function useUploadThumbnail() {
	return useMutation<
		UploadThumbnailResponse,
		UploadThumbnailError,
		{ articleId: number; file: File }
	>({
		mutationFn: async ({ articleId, file }) => {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/articles/${articleId}/thumbnail`,
				{
					method: "POST",
					body: formData,
				}
			);

			if (!response.ok) {
				const errorData = (await response.json()) as UploadThumbnailError;
				throw errorData;
			}

			return response.json();
		},
	});
}
