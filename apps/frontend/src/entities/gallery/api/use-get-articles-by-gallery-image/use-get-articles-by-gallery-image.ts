"use client";

import { useQuery } from "@tanstack/react-query";

import { extractErrorMessage, useHonoClient } from "@/shared/lib";

import type { ArticlesByGalleryImageResponse } from "../../model/types";

/**
 * ギャラリー画像を使用している記事一覧を取得するカスタムフック
 *
 * @description
 * 処理フロー:
 * 1. Honoクライアントを取得
 * 2. GET /api/gallery/:id/articles を呼び出し
 * 3. レスポンスを返す
 *
 * @param galleryImageId - ギャラリー画像ID
 * @returns 記事一覧のクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetArticlesByGalleryImage(123);
 * ```
 */
export function useGetArticlesByGalleryImage(galleryImageId: number | null) {
	const client = useHonoClient();

	return useQuery<ArticlesByGalleryImageResponse, Error>({
		queryKey: ["gallery", "articles", galleryImageId],
		queryFn: async () => {
			if (galleryImageId === null) {
				return { articles: [], total: 0 };
			}

			const response = await client.api.gallery[":id"].articles.$get({
				param: { id: String(galleryImageId) },
			});

			if (!response.ok) {
				const error = await response.json();
				const errorMessage = extractErrorMessage(
					error,
					"記事一覧の取得に失敗しました"
				);
				throw new Error(errorMessage);
			}

			return await response.json();
		},
		enabled: galleryImageId !== null,
	});
}
