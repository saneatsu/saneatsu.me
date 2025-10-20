"use client";

import { useQuery } from "@tanstack/react-query";

import { honoClient, type QueryConfig, queryKeys } from "@/shared/lib";
import type { ArticleStatus, ArticlesResponse } from "@/shared/model";

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
	/** 記事のステータス（複数選択可能） */
	status?: ArticleStatus[];
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
					// 配列の場合はカンマ区切りの文字列に変換
					status: status && status.length > 0 ? status.join(",") : undefined,
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
