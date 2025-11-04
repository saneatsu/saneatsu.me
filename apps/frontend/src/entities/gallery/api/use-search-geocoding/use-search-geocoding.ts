"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

import type {
	GeocodingSearchParams,
	GeocodingSearchResponse,
} from "../../model/types";

/**
 * ジオコーディング検索のオプション
 */
type UseSearchGeocodingOptions = GeocodingSearchParams & {
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<GeocodingSearchResponse>>;
	/** クエリの有効化フラグ（検索文字列が存在する場合のみ有効） */
	enabled?: boolean;
};

/**
 * 住所から座標を検索するカスタムフック（ジオコーディング）
 *
 * @param options - 検索オプション
 * @returns ジオコーディング検索結果を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSearchGeocoding({
 *   q: "東京都渋谷区",
 *   language: "ja",
 *   limit: 5
 * });
 * ```
 */
export function useSearchGeocoding({
	q,
	language = "ja",
	limit = 5,
	enabled = true,
	queryConfig = {},
}: UseSearchGeocodingOptions) {
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.geocoding.search({ q, language, limit }),
		queryFn: async () => {
			const response = await client.api.geocoding.search.$get({
				query: {
					q,
					language,
					limit: limit.toString(),
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(extractErrorMessage(error, "住所の検索に失敗しました"));
			}

			return await response.json();
		},
		...queryConfig,
		staleTime: 5 * 60 * 1000, // 5分間はデータを新鮮とみなす
		enabled: enabled && !!q && q.length > 0, // qが存在し、空でない場合のみクエリを実行
	});
}
