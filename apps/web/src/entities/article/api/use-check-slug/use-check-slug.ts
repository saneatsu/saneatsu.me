"use client";

import type { AppType } from "@saneatsu/backend";
import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";
import type { SlugCheckResponse } from "../../../../shared/types/article";

/**
 * APIのベースURL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Hono Clientの初期化
 */
const client = hc<AppType>(API_BASE_URL) as any;

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
					(error as { error?: string }).error ||
						"スラッグのチェックに失敗しました"
				);
			}

			const data = await response.json();
			return data as SlugCheckResponse;
		},
		...queryConfig,
		staleTime: 10 * 1000, // 10秒間はデータを新鮮とみなす
		enabled: !!slug && slug.length > 0, // スラッグが存在する場合のみクエリを実行
	});
}
