"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { honoClient, queryKeys } from "@/shared/lib";
import type { TagCreateRequest, TagCreateResponse } from "@/shared/model";

/**
 * タグを作成するカスタムフック
 *
 * @description
 * 新しいタグを作成する。作成成功時にタグ一覧のキャッシュを無効化する。
 *
 * @returns タグ作成用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const createTag = useCreateTag();
 *
 * const handleSubmit = async (data: TagCreateRequest) => {
 *   try {
 *     const result = await createTag.mutateAsync(data);
 *     router.push("/admin/tags");
 *     toast.success("タグを作成しました");
 *   } catch (error) {
 *     toast.error("タグの作成に失敗しました");
 *   }
 * };
 * ```
 */
export function useCreateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: TagCreateRequest) => {
			const response = await honoClient.api.tags.$post({
				json: {
					slug: data.slug,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				// エラーレスポンスの構造に応じて適切にメッセージを取得
				const errorMessage =
					(error as { error?: { message?: string } }).error?.message ||
					(error as { error?: string }).error ||
					(error as { message?: string }).message ||
					"タグの作成に失敗しました";
				throw new Error(errorMessage);
			}

			const result = await response.json();
			return result as TagCreateResponse;
		},
		onSuccess: () => {
			// タグ一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.tag.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to create tag:", error);
		},
	});
}
