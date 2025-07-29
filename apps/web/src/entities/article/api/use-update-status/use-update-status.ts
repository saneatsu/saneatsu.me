"use client";

import type { AppType } from "@saneatsu/backend";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hc } from "hono/client";
import { queryKeys } from "../../../../shared/lib/query-keys";

/**
 * APIのベースURL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Hono Clientの初期化
 */
const client = hc<AppType>(API_BASE_URL) as any;

/**
 * 記事のステータス更新パラメータ
 */
type UpdateStatusParams = {
	/** 記事ID */
	id: number;
	/** 新しいステータス */
	status: string;
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

	return useMutation({
		mutationFn: async ({ id, status }: UpdateStatusParams) => {
			// TODO: バックエンドにPATCH /admin/articles/:id/status エンドポイントを実装後にHono Client版に書き換え
			throw new Error("Not implemented yet");
		},
		onSuccess: () => {
			// 記事一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.article.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to update article status:", error);
		},
	});
}
