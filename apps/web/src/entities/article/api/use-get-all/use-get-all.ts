"use client";

import { useQuery } from "@tanstack/react-query";
import { honoClient } from "../../../../shared/lib/hono-client";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";
import type {
	ArticleStatus,
	ArticlesResponse,
} from "../../../../shared/types/article";

/**
 * 記事一覧取得のオプション
 */
type UseGetAllArticlesOptions = {
	/** ページ番号 */
	page?: number;
	/** 1ページあたりの記事数 */
	limit?: number;
	/** 言語 */
	language?: "ja" | "en";
	/** 記事のステータス */
	status?: ArticleStatus;
	/** 検索キーワード */
	search?: string;
	/** ソート対象フィールド */
	sortBy?: "createdAt" | "updatedAt" | "publishedAt" | "title" | "viewCount";
	/** ソート順序 */
	sortOrder?: "asc" | "desc";
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<ArticlesResponse>>;
};

/**
 * 記事一覧を取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns 記事一覧を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetAllArticles({
 *   page: 1,
 *   limit: 10,
 *   language: "ja",
 *   status: "published"
 * });
 * ```
 */
export function useGetAllArticles({
	page = 1,
	limit = 10,
	language = "ja",
	status,
	search,
	sortBy = "createdAt",
	sortOrder = "desc",
	queryConfig = {},
}: UseGetAllArticlesOptions = {}) {
	return useQuery({
		queryKey: queryKeys.article.all({
			page,
			limit,
			language,
			status,
			search,
			sortBy,
			sortOrder,
		}),
		queryFn: async () => {
			const response = await honoClient.api.articles.$get({
				query: {
					page: page.toString(),
					limit: limit.toString(),
					language,
					status,
					search,
					sortBy,
					sortOrder,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: string }).error || "記事の取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as ArticlesResponse;
		},
		...queryConfig,
		staleTime: 30 * 1000, // 30秒間はデータを新鮮とみなす
	});
}
