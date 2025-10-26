"use client";

import { useQuery } from "@tanstack/react-query";

import { honoClient, type QueryConfig, queryKeys } from "@/shared/lib";
import type { ArticlesResponse } from "@/shared/model";

/**
 * 関連記事を取得するオプション
 */
type UseGetRelatedOptions = {
	/** 記事のスラッグ */
	slug: string;
	/** 言語 */
	lang?: string;
	/** 取得する記事数 */
	limit?: number;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<ArticlesResponse>>;
};

/**
 * 関連記事を取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns 関連記事一覧を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetRelated({
 *   slug: "my-article",
 *   lang: "ja",
 *   limit: 6
 * });
 * ```
 */
export function useGetRelated({
	slug,
	lang,
	limit,
	queryConfig = {},
}: UseGetRelatedOptions) {
	return useQuery({
		queryKey: queryKeys.article.related(slug, lang, limit),
		queryFn: async () => {
			const response = await honoClient.api.articles[":slug"].related.$get({
				param: { slug },
				query: {
					language: lang,
					limit: limit?.toString(),
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: { message?: string } }).error?.message ||
						"関連記事の取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as ArticlesResponse;
		},
		...queryConfig,
		staleTime: 5 * 60 * 1000, // 5分間はデータを新鮮とみなす（関連記事はあまり変わらないため）
		enabled: !!slug, // スラッグが存在する場合のみクエリを実行
	});
}
