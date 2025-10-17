"use client";

import type { DashboardOverviewResponse } from "@saneatsu/schemas";
import { useQuery } from "@tanstack/react-query";

import { honoClient, type QueryConfig, queryKeys } from "@/shared/lib";

/**
 * ダッシュボード概要データ取得のオプション
 */
type UseDashboardOverviewOptions = {
	/** 言語 */
	language?: "ja" | "en";
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<DashboardOverviewResponse>>;
};

/**
 * ダッシュボード概要データを取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns ダッシュボード概要データを含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDashboardOverview({ language: "ja" });
 * ```
 */
export function useDashboardOverview({
	language = "ja",
	queryConfig = {},
}: UseDashboardOverviewOptions = {}) {
	return useQuery({
		queryKey: queryKeys.dashboard.overview(language),
		queryFn: async () => {
			const response = await honoClient.api.dashboard.overview.$get({
				query: { language },
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: string }).error ||
						"ダッシュボード概要データの取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as DashboardOverviewResponse;
		},
		...queryConfig,
		staleTime: 5 * 60 * 1000, // 5分間は新鮮とみなす
		gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
	});
}
