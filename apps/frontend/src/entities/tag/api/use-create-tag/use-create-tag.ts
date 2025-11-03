"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";
import type { TagCreateRequest } from "@/shared/model";

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
	const client = useHonoClient();

	return useMutation({
		mutationFn: async (data: TagCreateRequest) => {
			const response = await client.api.tags.$post({
				json: {
					name: data.name,
					slug: data.slug,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(extractErrorMessage(error, "タグの作成に失敗しました"));
			}

			return await response.json();
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
