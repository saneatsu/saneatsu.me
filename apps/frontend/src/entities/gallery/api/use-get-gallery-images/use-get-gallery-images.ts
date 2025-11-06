"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

import type {
	GalleryImagesQueryParams,
	GalleryImagesResponse,
} from "../../model/types";

/**
 * ギャラリー画像一覧取得のオプション
 */
type UseGetGalleryImagesOptions = GalleryImagesQueryParams & {
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<GalleryImagesResponse>>;
};

/**
 * ギャラリー画像一覧を取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns ギャラリー画像一覧を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetGalleryImages({
 *   page: 1,
 *   limit: 12,
 *   hasLocation: true,
 *   sortBy: "takenAt",
 *   sortOrder: "desc"
 * });
 * ```
 */
export function useGetGalleryImages({
	page = 1,
	limit = 12,
	hasLocation,
	sortBy = "createdAt",
	sortOrder = "desc",
	queryConfig = {},
}: UseGetGalleryImagesOptions = {}) {
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.gallery.all({
			page,
			limit,
			hasLocation,
			sortBy,
			sortOrder,
		}),
		queryFn: async () => {
			const response = await client.api.gallery.$get({
				query: {
					page: page.toString(),
					limit: limit.toString(),
					hasLocation:
						hasLocation !== undefined
							? hasLocation
								? "true"
								: "false"
							: undefined,
					sortBy,
					sortOrder,
				},
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
		staleTime: 30 * 1000, // 30秒間はデータを新鮮とみなす
	});
}
