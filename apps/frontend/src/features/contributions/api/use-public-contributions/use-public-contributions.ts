"use client";

import type { ContributionSummary } from "@saneatsu/schemas";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import type { QueryConfig } from "@/shared/lib";
import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

type ContributionRange = 30 | 90 | 180 | 365;

type UsePublicContributionsOptions = {
	range?: ContributionRange;
	locale?: "ja" | "en";
	queryConfig?: QueryConfig<() => Promise<ContributionSummary>>;
};

type PublicContributionsClient = {
	public: {
		contributions: {
			$get: (params: {
				query: { range: string; locale: "ja" | "en" };
			}) => Promise<Response>;
		};
	};
};

const RANGE_SET = new Set<ContributionRange>([30, 90, 180, 365]);

const FALLBACK_MESSAGE = {
	ja: "執筆アクティビティの取得に失敗しました",
	en: "Failed to load writing activity",
} as const;

/**
 * 公開APIから執筆データを取得するためのReact Queryフック。
 *
 * @param options.range 表示期間（日数）。指定外は365にフォールバック
 * @param options.locale ロケール（省略時は現在のUIロケール）
 * @param options.queryConfig React Query追加設定
 * @returns 執筆データを返す useQuery の結果
 */
export function usePublicContributions({
	range = 365,
	locale,
	queryConfig = {},
}: UsePublicContributionsOptions = {}) {
	const client = useHonoClient();
	const currentLocale = useLocale();
	// APIに渡すロケールを確定（ja/enのみ）
	const resolvedLocale = (locale ?? (currentLocale === "ja" ? "ja" : "en")) as
		| "ja"
		| "en";
	// 想定外の値が来ても 365 に丸める
	const normalizedRange = RANGE_SET.has(range) ? range : 365;

	return useQuery({
		queryKey: queryKeys.contributions.public(normalizedRange, resolvedLocale),
		queryFn: async () => {
			const publicApi = (
				client.api as typeof client.api & PublicContributionsClient
			).public;
			// OpenAPIビルドが追いつくまで型を手動で補完
			const response = await publicApi.contributions.$get({
				query: {
					range: normalizedRange.toString(),
					locale: resolvedLocale,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					extractErrorMessage(error, FALLBACK_MESSAGE[resolvedLocale])
				);
			}

			return (await response.json()) as ContributionSummary;
		},
		...queryConfig,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}
