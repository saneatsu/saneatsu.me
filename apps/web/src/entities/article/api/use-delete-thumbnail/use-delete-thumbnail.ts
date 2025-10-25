import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * サムネイル画像削除のレスポンス型
 */
export type DeleteThumbnailResponse = {
	message: string;
};

/**
 * サムネイル画像削除のエラー型
 */
export type DeleteThumbnailError = {
	error: {
		code: string;
		message: string;
	};
};

/**
 * サムネイル画像を削除するカスタムフック
 *
 * @description
 * 指定された記事IDのサムネイル画像を削除する。
 * DBのcfImageIdをnullに更新し、Cloudflare Imagesからも削除する。
 *
 * 処理フロー:
 * 1. DELETE /api/articles/:id/thumbnail にリクエスト
 * 2. レスポンスでmessageを受け取る
 *
 * @returns useMutationの戻り値
 *
 * @example
 * const deleteMutation = useDeleteThumbnail();
 *
 * const handleDelete = async (articleId: number) => {
 *   try {
 *     const result = await deleteMutation.mutateAsync({ articleId });
 *     console.log("削除成功:", result.message);
 *   } catch (error) {
 *     console.error("削除失敗:", error);
 *   }
 * };
 */
export function useDeleteThumbnail() {
	const queryClient = useQueryClient();

	return useMutation<
		DeleteThumbnailResponse,
		DeleteThumbnailError,
		{ articleId: number }
	>({
		mutationFn: async ({ articleId }) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/articles/${articleId}/thumbnail`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = (await response.json()) as DeleteThumbnailError;
				throw errorData;
			}

			return response.json();
		},
		onSuccess: (_data, variables) => {
			// 記事詳細のキャッシュを無効化して最新データを取得させる
			queryClient.invalidateQueries({
				queryKey: ["article", variables.articleId],
			});
		},
	});
}
