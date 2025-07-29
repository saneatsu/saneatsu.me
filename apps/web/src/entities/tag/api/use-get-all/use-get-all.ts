"use client";

import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "@saneatsu/backend";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";

/**
 * タグ一覧のレスポンス型
 */
interface Tag {
	id: number;
	slug: string;
	name: string | null;
	articleCount: number;
}

interface TagsResponse {
	data: Tag[];
}

/**
 * APIのベースURL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Hono Clientの初期化
 */
const client = hc<AppType>(API_BASE_URL) as any;

/**
 * タグ一覧取得のオプション
 */
type UseGetAllTagsOptions = {
	/** 言語 */
	lang?: "ja" | "en";
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<TagsResponse>>;
};

/**
 * タグ一覧を取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns タグ一覧を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetAllTags({ lang: "ja" });
 * ```
 */
export function useGetAllTags({
	lang = "ja",
	queryConfig = {},
}: UseGetAllTagsOptions = {}) {
	return useQuery({
		queryKey: queryKeys.tag.all(lang),
		queryFn: async () => {
			const response = await client.api.tags.$get({
				query: { lang },
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: string }).error ||
						"タグの取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as TagsResponse;
		},
		...queryConfig,
		staleTime: 30 * 1000, // 30秒間はデータを新鮮とみなす
	});
}
