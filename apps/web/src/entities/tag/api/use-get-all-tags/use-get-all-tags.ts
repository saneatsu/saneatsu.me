"use client";

import { useQuery } from "@tanstack/react-query";

import { honoClient, type QueryConfig, queryKeys } from "@/shared/lib";
import type { TagsResponse } from "@/shared/model";

/**
 * タグ一覧取得のオプション
 */
type UseGetAllTagsOptions = {
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<TagsResponse>>;
};

/**
 * タグ一覧を取得するカスタムフック
 *
 * @description
 * すべてのタグ一覧を取得する。各タグには記事数が含まれる。
 * 作成日時の昇順でソートされる。
 *
 * @param options - 取得オプション
 * @returns タグ一覧を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetAllTags();
 * ```
 */
export function useGetAllTags({ queryConfig = {} }: UseGetAllTagsOptions = {}) {
	return useQuery({
		queryKey: queryKeys.tag.all(),
		queryFn: async () => {
			const response = await honoClient.api.tags.$get();

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: string }).error || "タグの取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as TagsResponse;
		},
		...queryConfig,
		staleTime: 60 * 1000, // 60秒間はデータを新鮮とみなす
	});
}
