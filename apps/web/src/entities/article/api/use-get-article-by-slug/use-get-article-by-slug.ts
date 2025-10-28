"use client";

import { useQuery } from "@tanstack/react-query";

import { type QueryConfig, queryKeys, useHonoClient } from "@/shared/lib";
import type { ArticleResponse } from "@/shared/model";

/**
 * スラッグで記事を取得するオプション
 */
export type UseGetArticleBySlugOptions = {
	/** 記事のスラッグ */
	slug: string;
	/** 言語 */
	language?: "ja" | "en";
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<ArticleResponse>>;
};

/**
 * スラッグで記事を取得するカスタムフック
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
 * const { data, isLoading } = useGetArticleBySlug({
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
export function useGetArticleBySlug({
	slug,
	language = "ja",
	queryConfig = {},
}: UseGetArticleBySlugOptions) {
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.article.detail({ slug, language }),
		queryFn: async () => {
			const response = await client.api.articles[":slug"].$get({
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

			return await response.json();
		},
		...queryConfig,
		staleTime: 30 * 1000, // 30秒間はデータを新鮮とみなす
		enabled: !!slug && (queryConfig.enabled ?? true),
	});
}
