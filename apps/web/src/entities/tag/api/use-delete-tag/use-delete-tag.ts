import { useMutation, useQueryClient } from "@tanstack/react-query";

import { honoClient } from "@/shared/lib/hono-client";
import { queryKeys } from "@/shared/lib/query-keys";
import type { TagDeleteResponse } from "@/shared/model";

/**
 * タグ削除フック
 *
 * @description
 * DELETE /api/tags/:id でタグを削除するためのReact Query mutation。
 *
 * 処理フロー:
 * 1. タグIDを受け取る
 * 2. APIリクエストを送信
 * 3. 成功時にタグ一覧のキャッシュを無効化
 * 4. エラー時にログ出力
 *
 * @example
 * const deleteMutation = useDeleteTag();
 * await deleteMutation.mutateAsync(1);
 */
export function useDeleteTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			const response = await honoClient.api.tags[":id"].$delete({
				param: { id: String(id) },
			});

			if (!response.ok) {
				const error = await response.json();
				const errorMessage =
					(error as { error?: { message?: string } }).error?.message ||
					"タグの削除に失敗しました";
				throw new Error(errorMessage);
			}

			const result = await response.json();
			return result as TagDeleteResponse;
		},
		onSuccess: () => {
			// タグ一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({
				queryKey: queryKeys.tag.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to delete tag:", error);
		},
	});
}
