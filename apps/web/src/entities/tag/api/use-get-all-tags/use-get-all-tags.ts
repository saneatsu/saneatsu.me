"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";
import type { TagsResponse } from "@/shared/model";

/**
 * タグ一覧取得のオプション
 */
type UseGetAllTagsOptions = {
	/** 記事のステータスでフィルタリング（指定なしの場合は全ステータス） */
	status?: "published" | "draft" | "archived";
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
 * @param options.status - 記事のステータスでフィルタリング
 * @param options.queryConfig - React Queryの設定
 * @returns タグ一覧を含むクエリ結果
 *
 * @example
 * ```tsx
 * // 公開記事のみのタグ数を取得
 * const { data } = useGetAllTags({ status: 'published' });
 *
 * // 全ステータスのタグ数を取得
 * const { data } = useGetAllTags();
 * ```
 */
export function useGetAllTags({
	status,
	queryConfig = {},
}: UseGetAllTagsOptions = {}) {
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.tag.all(status),
		queryFn: async () => {
			const response = await client.api.tags.$get({
				query: status ? { status } : {},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(extractErrorMessage(error, "タグの取得に失敗しました"));
			}

			return await response.json();
		},
		...queryConfig,
		staleTime: 60 * 1000, // 60秒間はデータを新鮮とみなす
	});
}
