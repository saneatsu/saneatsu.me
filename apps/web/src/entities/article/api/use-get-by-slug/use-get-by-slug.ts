"use client";

import { useQuery } from "@tanstack/react-query";
import { honoClient } from "../../../../shared/lib/hono-client";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";
import type { ArticleResponse } from "../../../../shared/model/article";

/**
 * スラッグで記事を取得するオプション
 */
type UseGetBySlugOptions = {
	/** 記事のスラッグ */
	slug: string;
	/** 言語 */
	lang?: string;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<ArticleResponse>>;
};

/**
 * スラッグで記事を取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns 記事詳細を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetBySlug({
 *   slug: "my-article",
 *   lang: "ja"
 * });
 * ```
 */
export function useGetBySlug({
	slug,
	lang,
	queryConfig = {},
}: UseGetBySlugOptions) {
	return useQuery({
		queryKey: queryKeys.article.bySlug(slug, lang),
		queryFn: async () => {
			const response = await honoClient.api.articles[":slug"].$get({
				param: { slug },
				query: {
					lang,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: string }).error || "記事の取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as ArticleResponse;
		},
		...queryConfig,
		staleTime: 30 * 1000, // 30秒間はデータを新鮮とみなす
		enabled: !!slug, // スラッグが存在する場合のみクエリを実行
	});
}
