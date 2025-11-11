import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ContributionSummary } from "@/shared/model";

import { ContributionActivityCard } from "./contribution-activity-card";

const COPY = {
	title: "執筆アクティビティ",
	subtitle: "直近365日",
	rangeLabel: (days: number) => `直近${days}日`,
	toggleUpdates: "更新数",
	toggleJaChars: "日本語文字数",
	summaryTotalUpdates: "総更新数",
	summaryTotalJaChars: "総日本語文字数",
	summaryCurrentStreak: "連続日数",
	legendLabel: "密度",
	legendLess: "少ない",
	legendMore: "多い",
	empty: "まだ記録がありません",
	error: "執筆データの取得に失敗しました",
	retry: "再読み込み",
	lastUpdatedPrefix: "最終更新",
	metricUpdatesUnit: "更新",
	metricJaCharsUnit: "文字",
};

const summary: ContributionSummary = {
	startDate: "2024-11-12",
	endDate: "2025-11-11",
	totalUpdates: 120,
	totalJaChars: 54000,
	maxUpdates: 8,
	maxJaChars: 6000,
	days: [
		{ date: "2025-11-09", updates: 0, jaChars: 0 },
		{ date: "2025-11-10", updates: 2, jaChars: 800 },
		{ date: "2025-11-11", updates: 5, jaChars: 1200 },
	],
	lastUpdated: "2025-11-11T15:00:00Z",
};

describe("ContributionActivityCard", () => {
	it("サマリーとトグルを表示し、メトリクスの切り替えができる", async () => {
		render(
			<ContributionActivityCard
				summary={summary}
				copy={COPY}
				locale="ja-JP"
				rangeDays={365}
			/>
		);

		expect(screen.getByText("総更新数")).toBeInTheDocument();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.getByText("54,000")).toBeInTheDocument();

		const charToggle = screen.getByRole("button", { name: "日本語文字数" });
		await userEvent.click(charToggle);

		expect(charToggle).toHaveAttribute("aria-pressed", "true");
	});

	it("データがない場合は空メッセージを表示する", () => {
		const emptySummary: ContributionSummary = {
			...summary,
			totalUpdates: 0,
			totalJaChars: 0,
			maxUpdates: 0,
			maxJaChars: 0,
			days: summary.days.map((day) => ({ ...day, updates: 0, jaChars: 0 })),
		};

		render(
			<ContributionActivityCard
				summary={emptySummary}
				copy={COPY}
				locale="ja-JP"
			/>
		);

		expect(screen.getByText("まだ記録がありません")).toBeInTheDocument();
	});

	it("エラー時にリトライボタンを表示する", async () => {
		const onRetry = vi.fn();

		render(
			<ContributionActivityCard
				error={new Error("fetch failed")}
				onRetry={onRetry}
				copy={COPY}
			/>
		);

		await userEvent.click(screen.getByRole("button", { name: "再読み込み" }));

		expect(onRetry).toHaveBeenCalledTimes(1);
	});
});
