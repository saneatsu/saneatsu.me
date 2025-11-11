"use client";

import type { ContributionSummary } from "@saneatsu/schemas";
import { useDashboardOverview } from "@/features/dashboard";

import type { QueryConfig } from "@/shared/lib";
import type { DashboardOverviewResponseData } from "@/shared/model";

type UseDashboardContributionsOptions = {
	language?: "ja" | "en";
	queryConfig?: QueryConfig<() => Promise<DashboardOverviewResponseData>>;
};

/**
 * ダッシュボード概要APIから執筆データだけを抽出するラッパーフック。
 *
 * @param options.language 表示言語（デフォルトja）
 * @param options.queryConfig React Queryの追加設定
 * @returns useDashboardOverviewの結果をベースに `contributions` だけを取り出したクエリ結果
 */
export function useDashboardContributions({
	language = "ja",
	queryConfig,
}: UseDashboardContributionsOptions = {}) {
	// 既存のダッシュボード概要クエリをそのまま再利用する
	const query = useDashboardOverview({ language, queryConfig });

	return {
		...query,
		// 型定義を狭めて執筆データだけを返す
		data: query.data?.contributions as ContributionSummary | undefined,
	};
}
