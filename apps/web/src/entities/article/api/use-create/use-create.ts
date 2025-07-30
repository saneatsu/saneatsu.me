"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { honoClient } from "../../../../shared/lib/hono-client";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type {
	ArticleCreateRequest,
	ArticleCreateResponse,
} from "../../../../shared/types/article";

/**
 * 記事を作成するカスタムフック
 *
 * @returns 記事作成用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const createArticle = useCreate();
 *
 * const handleSubmit = async (data: ArticleCreateRequest) => {
 *   try {
 *     const result = await createArticle.mutateAsync(data);
 *     router.push(`/admin/articles/${result.data.slug}/edit`);
 *     toast.success("記事を作成しました");
 *   } catch (error) {
 *     toast.error("記事の作成に失敗しました");
 *   }
 * };
 * ```
 */
export function useCreate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: ArticleCreateRequest) => {
			const response = await honoClient.api.articles.$post({
				json: {
					title: data.title,
					slug: data.slug,
					content: data.content,
					status: data.status,
					publishedAt: data.publishedAt,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: string }).error || "記事の作成に失敗しました"
				);
			}

			const result = await response.json();
			return result as ArticleCreateResponse;
		},
		onSuccess: () => {
			// 記事一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.article.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to create article:", error);
		},
	});
}
