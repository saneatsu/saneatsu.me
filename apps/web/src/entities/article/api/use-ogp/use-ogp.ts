import { useQuery } from "@tanstack/react-query";

import { honoClient } from "@/shared/lib";
import { apiClient } from "../../../../shared/api/client";

/**
 * OGP情報の型定義
 */
interface OgpData {
	title: string | null;
	description: string | null;
	image: string | null;
	favicon: string | null;
	siteName: string | null;
	url: string;
}

/**
 * OGP情報を取得するカスタムフック
 *
 * @param url - OGP情報を取得するURL
 * @returns TanStack Queryのクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useOgp("https://example.com");
 * ```
 */
export const useOgp = (url: string) => {
	return useQuery({
		queryKey: ["ogp", url],
		queryFn: async () => {
			const response = await honoClient.api.ogp.$get({
				query: { url },
			});

			if (!response.ok) {
				throw new Error("Failed to fetch OGP data");
			}

			const json = await response.json();
			return json.data as OgpData;
		},
		// 同じURLは24時間キャッシュ
		staleTime: 1000 * 60 * 60 * 24,
		// OGP情報は変更されにくいので、再フェッチしない
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: 1,
	});
};
