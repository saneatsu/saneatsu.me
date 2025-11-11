import type { Meta, StoryObj } from "@storybook/nextjs";

import type { ContributionSummary } from "@/shared/model";

import {
	type ContributionCopy,
	ContributionHeatmap,
} from "./contribution-heatmap";

const meta = {
	component: ContributionHeatmap,
	parameters: {
		layout: "padded",
	},
} satisfies Meta<typeof ContributionHeatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

const BASE_SUMMARY: ContributionSummary = {
	startDate: "2024-11-12",
	endDate: "2025-11-11",
	totalJaChars: 54000,
	maxJaChars: 6000,
	days: Array.from({ length: 365 }, (_, index) => {
		const date = new Date("2024-11-12");
		date.setDate(date.getDate() + index);
		return {
			date: date.toISOString().split("T")[0],
			jaChars: Math.floor(Math.random() * 2000),
		};
	}),
	lastUpdated: "2025-11-11T15:00:00Z",
};

const EMPTY_SUMMARY: ContributionSummary = {
	...BASE_SUMMARY,
	totalJaChars: 0,
	maxJaChars: 0,
	days: BASE_SUMMARY.days.map((day) => ({ ...day, jaChars: 0 })),
};

const COPY: ContributionCopy = {
	title: "執筆アクティビティ",
	subtitle: "直近365日の日本語文字数",
	rangeLabel: (days: number) => `直近${days}日`,
	summaryTotalJaChars: "文字数（日本語）",
	legendLess: "少ない",
	legendMore: "多い",
	error: "執筆データの取得に失敗しました",
	retry: "再読み込み",
	metricJaCharsUnit: "文字",
};

export const Default: Story = {
	name: "通常表示",
	args: {
		summary: BASE_SUMMARY,
		copy: COPY,
		locale: "ja-JP",
		rangeDays: 365,
	},
};

export const Empty: Story = {
	name: "執筆データなし",
	args: {
		summary: EMPTY_SUMMARY,
		copy: COPY,
		locale: "ja-JP",
		rangeDays: 365,
	},
};

export const Loading: Story = {
	name: "ローディング",
	args: {
		isLoading: true,
		copy: COPY,
		locale: "ja-JP",
	},
};

export const ErrorState: Story = {
	name: "エラー",
	args: {
		summary: undefined,
		error: new Error("failed"),
		onRetry: () => {},
		copy: COPY,
		locale: "ja-JP",
	},
};
