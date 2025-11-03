"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";
import type { RelatedArticlesResponse } from "@/shared/model";

/**
 * 関連記事を取得するオプション
 */
type UseGetRelatedOptions = {
	/** 記事のスラッグ */
	slug: string;
	/** 言語 */
	lang?: "ja" | "en";
	/** 取得する記事数 */
	limit?: number;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<RelatedArticlesResponse>>;
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
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.article.related(slug, lang, limit),
		queryFn: async () => {
			const response = await client.api.articles[":slug"].related.$get({
				param: { slug },
				query: {
					language: lang,
					limit: limit?.toString(),
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					extractErrorMessage(error, "関連記事の取得に失敗しました")
				);
			}

			return await response.json();
		},
		...queryConfig,
		staleTime: 5 * 60 * 1000, // 5分間はデータを新鮮とみなす（関連記事はあまり変わらないため）
		enabled: !!slug, // スラッグが存在する場合のみクエリを実行
	});
}
