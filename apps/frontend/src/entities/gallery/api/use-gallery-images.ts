"use client";

import { useQuery } from "@tanstack/react-query";

import { extractErrorMessage, useHonoClient } from "@/shared/lib";

import type { GalleryImagesQuery, GalleryImagesResponse } from "../model/types";

/**
 * ギャラリー画像一覧を取得するカスタムフック
 *
 * @description
 * 処理フロー:
 * 1. Honoクライアントを取得
 * 2. クエリパラメータを構築
 * 3. GET /api/gallery/images を呼び出し
 * 4. レスポンスを返す
 *
 * @param query - クエリパラメータ
 * @returns ギャラリー画像一覧のクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGalleryImages({ page: "1", limit: "20" });
 * ```
 */
export function useGalleryImages(query: GalleryImagesQuery = {}) {
	const client = useHonoClient();

	return useQuery<GalleryImagesResponse, Error>({
		queryKey: ["gallery", "images", query],
		queryFn: async () => {
			const response = await client.api.gallery.$get({
				query: {
					page: query.page,
					limit: query.limit,
					sortBy: query.sortBy,
					sortOrder: query.sortOrder,
					hasLocation: query.hasLocation,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				const errorMessage = extractErrorMessage(
					error,
					"ギャラリー画像の取得に失敗しました"
				);
				throw new Error(errorMessage);
			}

			return await response.json();
		},
	});
}
