"use client";

import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "@saneatsu/backend";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";
import type { ViewsTrendResponse } from "@saneatsu/schemas/dist/dashboard";

/**
 * APIのベースURL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Hono Clientの初期化
 */
const client = hc<AppType>(API_BASE_URL);

/**
 * 閲覧数推移データ取得のオプション
 */
type UseViewsTrendOptions = {
	/** 言語 */
	language?: "ja" | "en";
	/** 表示期間（日数） */
	days?: 30 | 90 | 180 | 360;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<ViewsTrendResponse>>;
};

/**
 * 閲覧数推移データを取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns 閲覧数推移データを含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useViewsTrend({ 
 *   language: "ja",
 *   days: 30 
 * });
 * ```
 */
export function useViewsTrend({
	language = "ja",
	days = 30,
	queryConfig = {},
}: UseViewsTrendOptions = {}) {
	return useQuery({
		queryKey: queryKeys.dashboard.viewsTrend(language, days),
		queryFn: async () => {
			const response = await client.api.dashboard["views-trend"].$get({
				query: { 
					language,
					days: days.toString(),
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: string }).error ||
						"閲覧数推移データの取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as ViewsTrendResponse;
		},
		...queryConfig,
		staleTime: 5 * 60 * 1000, // 5分間は新鮮とみなす
		gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
	});
}