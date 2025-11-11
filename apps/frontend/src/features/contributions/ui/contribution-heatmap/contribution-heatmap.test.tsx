import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ContributionSummary } from "@/shared/model";

import { ContributionHeatmap } from "./contribution-heatmap";

const COPY = {
	title: "執筆アクティビティ",
	subtitle: "直近365日",
	rangeLabel: (days: number) => `直近${days}日`,
	summaryTotalJaChars: "文字数（日本語）",
	summaryCurrentStreak: "連続日数",
	legendLess: "少ない",
	legendMore: "多い",
	empty: "まだ記録がありません",
	error: "執筆データの取得に失敗しました",
	retry: "再読み込み",
	metricJaCharsUnit: "文字",
};

const summary: ContributionSummary = {
	startDate: "2024-11-12",
	endDate: "2025-11-11",
	totalJaChars: 54000,
	maxJaChars: 6000,
	days: [
		{ date: "2025-11-09", jaChars: 0 },
		{ date: "2025-11-10", jaChars: 800 },
		{ date: "2025-11-11", jaChars: 1200 },
	],
	lastUpdated: "2025-11-11T15:00:00Z",
};

describe("ContributionHeatmap", () => {
	it("サマリーの値を表示できる", () => {
		render(
			<ContributionHeatmap
				summary={summary}
				copy={COPY}
				locale="ja-JP"
				rangeDays={365}
			/>
		);

		expect(screen.getByText("文字数（日本語）")).toBeInTheDocument();
		expect(screen.getByText("54,000")).toBeInTheDocument();
		expect(screen.getByText("連続日数")).toBeInTheDocument();
	});

	it("データがない場合は空メッセージを表示する", () => {
		const emptySummary: ContributionSummary = {
			...summary,
			totalJaChars: 0,
			maxJaChars: 0,
			days: summary.days.map((day) => ({ ...day, jaChars: 0 })),
		};

		render(
			<ContributionHeatmap summary={emptySummary} copy={COPY} locale="ja-JP" />
		);

		expect(screen.getByText("まだ記録がありません")).toBeInTheDocument();
	});

	it("エラー時にリトライボタンを表示する", async () => {
		const onRetry = vi.fn();

		render(
			<ContributionHeatmap
				error={new Error("fetch failed")}
				onRetry={onRetry}
				copy={COPY}
			/>
		);

		await userEvent.click(screen.getByRole("button", { name: "再読み込み" }));

		expect(onRetry).toHaveBeenCalledTimes(1);
	});
});
