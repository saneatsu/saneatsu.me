"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";

/**
 * スラッグ重複チェックのレスポンス型
 */
interface CheckSlugResponse {
	available: boolean;
	slug: string;
}

/**
 * スラッグ重複チェックのオプション
 */
type UseCheckTagSlugOptions = {
	/** チェックするスラッグ */
	slug: string;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<CheckSlugResponse>>;
};

/**
 * タグのスラッグ重複をチェックするカスタムフック
 *
 * @param options - チェックオプション
 * @returns スラッグの利用可否を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCheckTagSlug({
 *   slug: "javascript",
 *   queryConfig: {
 *     enabled: slug.length > 0,
 *   },
 * });
 * ```
 */
export function useCheckTagSlug({
	slug,
	queryConfig = {},
}: UseCheckTagSlugOptions) {
	return useQuery({
		queryKey: queryKeys.tag.checkSlug(slug),
		queryFn: async () => {
			// 現在はタグ一覧から重複をチェックする簡易実装
			// 将来的には専用のAPIエンドポイントを使用
			const response = await fetch("/api/tags?lang=ja");

			if (!response.ok) {
				throw new Error("タグ一覧の取得に失敗しました");
			}

			const { data } = await response.json();
			const tags = data as Array<{ slug: string }>;
			
			// スラッグが既に使用されているかチェック
			const isUsed = tags.some(tag => tag.slug === slug);
			
			return {
				available: !isUsed,
				slug,
			} as CheckSlugResponse;
		},
		// スラッグが空の場合はクエリを実行しない
		enabled: slug.length > 0,
		// 30秒間キャッシュ
		staleTime: 30 * 1000,
		...queryConfig,
	});
}