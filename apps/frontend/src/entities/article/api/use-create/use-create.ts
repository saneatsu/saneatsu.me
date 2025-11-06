"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";
import type { ArticleCreateRequest } from "@/shared/model";

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
	const client = useHonoClient();

	return useMutation({
		mutationFn: async (data: ArticleCreateRequest) => {
			const response = await client.api.articles.$post({
				json: {
					title: data.title,
					slug: data.slug,
					content: data.content,
					status: data.status,
					publishedAt: data.publishedAt,
					tagIds: data.tagIds || [], // 空配列をデフォルトとする
					cfImageId: data.cfImageId, // サムネイル画像ID
					galleryImageIds: data.galleryImageIds || [], // ギャラリー画像ID配列
				},
			});

			if (!response.ok) {
				const error = await response.json();
				const errorMessage = extractErrorMessage(
					error,
					"記事の作成に失敗しました"
				);
				throw new Error(errorMessage);
			}

			return await response.json();
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
