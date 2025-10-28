"use client";

import { useQuery } from "@tanstack/react-query";

import type { QueryConfig } from "@/shared/lib";
import {
	extractErrorMessage,
	queryKeys,
	useDebounce,
	useHonoClient,
} from "@/shared/lib";

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
interface SuggestionsResponse {
	/** サジェスト配列 */
	suggestions: SuggestionItem[];
	/** キャッシュから取得したか */
	fromCache: boolean;
}

/**
 * 記事サジェスト取得オプション
 */
type UseArticleSuggestionsOptions = {
	/** 検索クエリ */
	query: string;
	/** 言語 */
	language?: "ja" | "en";
	/** 最大件数 */
	limit?: number;
	/** 特定記事の見出しのみを取得したい場合の記事スラッグ */
	targetSlug?: string;
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
	targetSlug,
	queryConfig = {},
}: UseArticleSuggestionsOptions) {
	// APIリクエストを300msでデバウンス
	const debouncedQuery = useDebounce(query, 300);
	const client = useHonoClient();

	return useQuery({
		queryKey: queryKeys.article.suggestions({
			query: debouncedQuery,
			language,
			limit,
			targetSlug,
		}),
		queryFn: async () => {
			const queryParams: {
				q: string;
				lang: "ja" | "en";
				limit: string;
				targetSlug?: string;
			} = {
				q: debouncedQuery,
				lang: language,
				limit: limit.toString(),
			};

			// targetSlugが指定されている場合のみ追加
			if (targetSlug) {
				queryParams.targetSlug = targetSlug;
			}

			const response = await client.api.articles.suggestions.$get({
				query: queryParams,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					extractErrorMessage(error, "サジェストの取得に失敗しました")
				);
			}

			return await response.json();
		},
		staleTime: 0, // 常に新しいデータを取得（リアルタイム検索のため）
		gcTime: 0, // キャッシュを即座に削除（React Query v5）
		enabled: debouncedQuery != null, // デバウンスされたクエリが存在する場合のみ実行（空文字列も有効）
		...queryConfig, // queryConfigのenabledでオーバーライド可能
	});
}
