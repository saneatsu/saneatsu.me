"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

import type { GalleryImage } from "../../model/types";

/**
 * ギャラリー画像詳細取得のオプション
 */
type UseGetGalleryImageByIdOptions = {
	/** 画像ID */
	id: number;
	/** 言語 */
	language?: "ja" | "en";
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<GalleryImage>>;
};

/**
 * ギャラリー画像の詳細を取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns ギャラリー画像の詳細を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetGalleryImageById({
 *   id: 123,
 *   language: "ja"
 * });
 * ```
 */
export function useGetGalleryImageById({
	id,
	language = "ja",
	queryConfig = {},
}: UseGetGalleryImageByIdOptions) {
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.gallery.byId(id, language),
		queryFn: async () => {
			const response = await client.api.gallery[":id"].$get({
				param: { id: id.toString() },
				query: { language },
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					extractErrorMessage(error, "ギャラリー画像の取得に失敗しました")
				);
			}

			return await response.json();
		},
		...queryConfig,
		staleTime: 5 * 60 * 1000, // 5分間はデータを新鮮とみなす
		enabled: !!id, // idが存在する場合のみクエリを実行
	});
}
