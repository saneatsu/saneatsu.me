"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { MutationConfig } from "../../../../shared/lib/react-query";

/**
 * タグ削除のレスポンス型
 */
interface DeleteTagResponse {
	message: string;
}

/**
 * タグ削除のオプション
 */
type UseDeleteTagOptions = {
	/** React Queryの設定 */
	mutationConfig?: MutationConfig<(tagId: number) => Promise<DeleteTagResponse>>;
};

/**
 * タグ削除用のカスタムフック
 *
 * @param options - 削除オプション
 * @returns タグ削除のmutation
 *
 * @example
 * ```tsx
 * const { mutate: deleteTag, isPending } = useDeleteTag({
 *   mutationConfig: {
 *     onSuccess: () => {
 *       toast.success("タグを削除しました");
 *     },
 *     onError: (error) => {
 *       if (error.message.includes("使用中")) {
 *         toast.error("このタグは記事で使用されているため削除できません");
 *       } else {
 *         toast.error("タグの削除に失敗しました");
 *       }
 *     },
 *   },
 * });
 * ```
 */
export function useDeleteTag({
	mutationConfig = {},
}: UseDeleteTagOptions = {}) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (tagId: number) => {
			const response = await fetch(`/api/tags/${tagId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("タグが見つかりません");
				}
				if (response.status === 409) {
					throw new Error("このタグは記事で使用されているため削除できません");
				}
				const error = await response.json();
				throw new Error(
					(error as { error?: { message?: string } }).error?.message ||
						"タグの削除に失敗しました"
				);
			}

			const result = await response.json();
			return result as DeleteTagResponse;
		},
		onSuccess: (data, tagId) => {
			// 削除されたタグの個別キャッシュを削除
			queryClient.removeQueries({ queryKey: queryKeys.tag.byId(tagId) });
			
			// タグ一覧のキャッシュを無効化
			queryClient.invalidateQueries({ queryKey: queryKeys.tag.all() });
			
			// 成功時のコールバックを実行
			mutationConfig.onSuccess?.(data, tagId, undefined);
		},
		...mutationConfig,
	});
}