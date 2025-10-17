"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

/**
 * 記事を削除するカスタムフック
 *
 * @returns 記事削除用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const deleteArticle = useDelete();
 *
 * const handleDelete = async (id: number) => {
 *   if (!confirm("本当に削除しますか？")) return;
 *
 *   try {
 *     await deleteArticle.mutateAsync(id);
 *     toast.success("記事を削除しました");
 *   } catch (error) {
 *     toast.error("記事の削除に失敗しました");
 *   }
 * };
 * ```
 */
export function useDelete() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (_id: number) => {
			// TODO: バックエンドにDELETE /admin/articles/:id エンドポイントを実装後にHono Client版に書き換え
			throw new Error("Not implemented yet");
		},
		onSuccess: () => {
			// 記事一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.article.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to delete article:", error);
		},
	});
}
