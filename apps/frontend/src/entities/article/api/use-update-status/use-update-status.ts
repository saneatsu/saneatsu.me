"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

/**
 * 記事のステータス更新パラメータ
 */
type UpdateStatusParams = {
	/** 記事ID */
	id: number;
	/** 新しいステータス */
	status: "draft" | "published" | "archived";
};

/**
 * 記事のステータスを更新するカスタムフック
 *
 * @returns ステータス更新用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const updateStatus = useUpdateStatus();
 *
 * const handleStatusUpdate = async () => {
 *   try {
 *     await updateStatus.mutateAsync({
 *       id: articleId,
 *       status: "published"
 *     });
 *     toast.success("ステータスを更新しました");
 *   } catch (error) {
 *     toast.error("ステータスの更新に失敗しました");
 *   }
 * };
 * ```
 */
export function useUpdateStatus() {
	const queryClient = useQueryClient();
	const client = useHonoClient();

	return useMutation({
		mutationFn: async ({ id, status }: UpdateStatusParams) => {
			const response = await client.api.articles[":id"].status.$patch({
				param: { id: String(id) },
				json: { status },
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					extractErrorMessage(error, "記事ステータスの更新に失敗しました")
				);
			}

			return response.json();
		},
		onSuccess: (_data, variables) => {
			const statusText =
				variables.status === "published"
					? "公開"
					: variables.status === "draft"
						? "下書き"
						: "アーカイブ";
			toast.success(`記事のステータスを「${statusText}」に変更しました`);
			// 記事一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.article.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to update article status:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "記事ステータスの更新に失敗しました"
			);
		},
	});
}
