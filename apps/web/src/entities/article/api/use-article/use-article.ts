"use client";

import { useQuery } from "@tanstack/react-query";

import { honoClient, type QueryConfig, queryKeys } from "@/shared/lib";
import type { Article } from "@/shared/model";

/**
 * 記事詳細取得レスポンスの型
 */
export interface ArticleDetailResponse {
	data: Article;
}

/**
 * 記事詳細取得オプション
 */
export type UseArticleOptions = {
	/** 記事のスラッグ */
	slug: string;
	/** 言語 */
	language?: "ja" | "en";
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<ArticleDetailResponse>>;
};

/**
 * 記事詳細を取得するカスタムフック
 *
 * @description
 * スラッグから記事の詳細情報を取得します。
 * Wiki Linkの表示など、記事タイトルが必要な場面で使用されます。
 *
 * @param options - 記事取得オプション
 * @returns 記事詳細を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useArticle({
 *   slug: "nextjs-basics",
 *   language: "ja"
 * });
 *
 * // 記事タイトルの表示
 * if (data) {
 *   return <span>{data.data.title}</span>;
 * }
 * ```
 */
export function useArticle({
	slug,
	language = "ja",
	queryConfig = {},
}: UseArticleOptions) {
	return useQuery({
		queryKey: queryKeys.article.detail({ slug, language }),
		queryFn: async () => {
			const response = await honoClient.api.articles[":slug"].$get({
				param: { slug },
				query: { lang: language },
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: { message?: string } }).error?.message ||
						"記事の取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as ArticleDetailResponse;
		},
		...queryConfig,
		enabled: !!slug && queryConfig.enabled !== false,
	});
}
