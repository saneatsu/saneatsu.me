"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

import type {
	AdminGalleryImagesQueryParams,
	GalleryImagesResponse,
} from "../../model/types";

/**
 * Admin用ギャラリー画像一覧取得のオプション
 */
type UseGetAdminGalleryImagesOptions = AdminGalleryImagesQueryParams & {
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<GalleryImagesResponse>>;
};

/**
 * Admin用ギャラリー画像一覧を取得するカスタムフック
 *
 * @description
 * 管理画面専用のギャラリー画像一覧取得フック。
 * 公開・下書きステータスに関わらずすべての画像を取得できる。
 *
 * @param options - 取得オプション
 * @returns ギャラリー画像一覧を含むクエリ結果
 *
 * @example
 * ```tsx
 * // すべてのステータスの画像を取得
 * const { data } = useGetAdminGalleryImages({
 *   page: 1,
 *   limit: 20,
 * });
 *
 * // 公開済み画像のみを取得
 * const { data } = useGetAdminGalleryImages({
 *   page: 1,
 *   limit: 20,
 *   status: "published"
 * });
 *
 * // 下書き画像のみを取得
 * const { data } = useGetAdminGalleryImages({
 *   page: 1,
 *   limit: 20,
 *   status: "draft"
 * });
 *
 * // 公開済みと下書きの両方を取得
 * const { data } = useGetAdminGalleryImages({
 *   page: 1,
 *   limit: 20,
 *   status: "published,draft"
 * });
 * ```
 */
export function useGetAdminGalleryImages({
	page = 1,
	limit = 20,
	hasLocation,
	sortBy = "createdAt",
	sortOrder = "desc",
	status,
	queryConfig = {},
}: UseGetAdminGalleryImagesOptions = {}) {
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.gallery.all({
			page,
			limit,
			hasLocation,
			sortBy,
			sortOrder,
			status,
		}),
		queryFn: async () => {
			const response = await client.api.gallery.admin.$get({
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
					status,
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
