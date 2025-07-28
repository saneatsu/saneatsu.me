"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";

/**
 * タグ詳細のレスポンス型
 */
export interface TagDetail {
	id: number;
	slug: string;
	createdAt: string;
	updatedAt: string;
	translations: {
		id: number;
		name: string;
		language: "ja" | "en";
		tagId: number;
	}[];
}

/**
 * タグ詳細取得のレスポンス型
 */
interface TagDetailResponse {
	data: TagDetail;
}

/**
 * タグ詳細取得のオプション
 */
type UseGetTagByIdOptions = {
	/** タグID */
	id: number;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<TagDetailResponse>>;
};

/**
 * IDによるタグ詳細を取得するカスタムフック
 *
 * @param options - 取得オプション
 * @returns タグ詳細を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetTagById({
 *   id: 1,
 *   queryConfig: {
 *     enabled: id > 0,
 *   },
 * });
 * ```
 */
export function useGetTagById({
	id,
	queryConfig = {},
}: UseGetTagByIdOptions) {
	return useQuery({
		queryKey: queryKeys.tag.byId(id),
		queryFn: async () => {
			const response = await fetch(`/api/tags/${id}`);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("タグが見つかりません");
				}
				const error = await response.json();
				throw new Error(
					(error as { error?: { message?: string } }).error?.message ||
						"タグの取得に失敗しました"
				);
			}

			const result = await response.json();
			return result as TagDetailResponse;
		},
		// IDが0以下の場合はクエリを実行しない
		enabled: id > 0,
		...queryConfig,
	});
}

/**
 * タグ詳細から編集フォーム用の初期値を生成するヘルパー関数
 */
export function getTagFormInitialValues(tagDetail: TagDetail) {
	const jaTranslation = tagDetail.translations.find(t => t.language === "ja");
	const enTranslation = tagDetail.translations.find(t => t.language === "en");

	return {
		slug: tagDetail.slug,
		nameJa: jaTranslation?.name || "",
		nameEn: enTranslation?.name || "",
	};
}