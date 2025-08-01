"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../../../../shared/hooks/use-debounce";
import { honoClient } from "../../../../shared/lib/hono-client";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { QueryConfig } from "../../../../shared/lib/react-query";

/**
 * サジェストアイテムの型
 */
export interface SuggestionItem {
	/** 記事のスラッグ */
	slug: string;
	/** 表示するタイトル */
	title: string;
	/** サジェストのタイプ */
	type: "article" | "heading";
	/** 見出しのレベル（見出しの場合のみ） */
	headingLevel?: number;
	/** 見出しのID（URLアンカー用） */
	headingId?: string;
	/** 親記事のタイトル（見出しの場合のみ） */
	articleTitle?: string;
}

/**
 * サジェストレスポンスの型
 */
export interface SuggestionsResponse {
	/** サジェスト配列 */
	suggestions: SuggestionItem[];
	/** キャッシュから取得したか */
	fromCache: boolean;
}

/**
 * 記事サジェスト取得オプション
 */
export type UseArticleSuggestionsOptions = {
	/** 検索クエリ */
	query: string;
	/** 言語 */
	language?: "ja" | "en";
	/** 最大件数 */
	limit?: number;
	/** React Queryの設定 */
	queryConfig?: QueryConfig<() => Promise<SuggestionsResponse>>;
};

/**
 * 記事と見出しのサジェストを取得するカスタムフック
 *
 * @description
 * Wiki Link機能で使用される記事タイトルと見出しのサジェストを取得します。
 * `[[`記法で記事を参照する際の候補を表示するために使用されます。
 *
 * @param options - サジェスト取得オプション
 * @returns サジェスト結果を含むクエリ結果
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useArticleSuggestions({
 *   query: "Next",
 *   language: "ja",
 *   limit: 20
 * });
 *
 * // サジェストの表示
 * data?.suggestions.map(suggestion => {
 *   if (suggestion.type === "article") {
 *     return <div>{suggestion.title}</div>;
 *   } else {
 *     return <div>{suggestion.title} ({suggestion.articleTitle})</div>;
 *   }
 * });
 * ```
 */
export function useArticleSuggestions({
	query,
	language = "ja",
	limit = 20,
	queryConfig = {},
}: UseArticleSuggestionsOptions) {
	// APIリクエストを300msでデバウンス
	const debouncedQuery = useDebounce(query, 300);
	
	return useQuery({
		queryKey: queryKeys.article.suggestions({ query: debouncedQuery, language, limit }),
		queryFn: async () => {
			const response = await honoClient.api.articles.suggestions.$get({
				query: {
					q: debouncedQuery,
					lang: language,
					limit: limit.toString(),
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: { message?: string } }).error?.message ||
						"サジェストの取得に失敗しました"
				);
			}

			const data = await response.json();
			return data as SuggestionsResponse;
		},
		...queryConfig,
		staleTime: 30 * 1000, // 30秒間はデータを新鮮とみなす
		enabled: !!debouncedQuery && debouncedQuery.length > 0, // デバウンスされたクエリが存在する場合のみ実行
	});
}
