"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";
import type { SlugCheckResponse } from "@/shared/model";

/**
 * スラッグの重複チェックオプション
 */
type UseCheckSlugOptions = {
	/** チェックするスラッグ */
	slug: string;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<SlugCheckResponse>>;
};

/**
 * スラッグの重複をチェックするカスタムフック
 *
 * @param options - チェックオプション
 * @returns スラッグチェック結果を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCheckSlug({
 *   slug: "my-new-article"
 * });
 *
 * if (data && !data.available) {
 *   // スラッグが既に使用されている
 *   setError("このスラッグは既に使用されています");
 * }
 * ```
 */
export function useCheckSlug({ slug, queryConfig = {} }: UseCheckSlugOptions) {
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.article.checkSlug(slug),
		queryFn: async () => {
			const response = await client.api.articles["check-slug"].$get({
				query: {
					slug,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					extractErrorMessage(error, "スラッグのチェックに失敗しました")
				);
			}

			return await response.json();
		},
		...queryConfig,
		staleTime: 10 * 1000, // 10秒間はデータを新鮮とみなす
		enabled: !!slug && slug.length > 0, // スラッグが存在する場合のみクエリを実行
	});
}
