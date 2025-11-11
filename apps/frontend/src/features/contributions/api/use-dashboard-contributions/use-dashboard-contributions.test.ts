import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
	ContributionSummary,
	DashboardOverviewResponseData,
} from "@/shared/model";

import { useDashboardContributions } from "./use-dashboard-contributions";

const mockUseDashboardOverview = vi.fn();

vi.mock("@/features/dashboard", () => ({
	useDashboardOverview: (...args: unknown[]) =>
		mockUseDashboardOverview(...args),
}));

describe("useDashboardContributions", () => {
	beforeEach(() => {
		mockUseDashboardOverview.mockReset();
	});

	it("ダッシュボード概要クエリの結果から執筆データだけを返す", () => {
		const mockSummary: ContributionSummary = {
			startDate: "2025-01-01",
			endDate: "2025-12-31",
			totalUpdates: 200,
			totalJaChars: 120000,
			maxUpdates: 8,
			maxJaChars: 6000,
			days: [{ date: "2025-10-01", updates: 3, jaChars: 900 }],
			lastUpdated: "2025-11-11T10:00:00Z",
		};

		const mockResponse: DashboardOverviewResponseData = {
			articleStats: {
				totalArticles: 10,
				publishedArticles: 5,
				draftArticles: 3,
				archivedArticles: 2,
				thisMonthArticles: 1,
				totalViews: 1000,
				thisMonthViews: 200,
			},
			topArticles: { articles: [] },
			recentActivities: { activities: [] },
			contributions: mockSummary,
			lastUpdated: "2025-11-11T10:00:00Z",
		};

		const mockQueryResult = {
			data: mockResponse,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		};

		mockUseDashboardOverview.mockReturnValue(mockQueryResult);

		const { result } = renderHook(() => useDashboardContributions());

		expect(result.current.data).toEqual(mockSummary);
		expect(mockUseDashboardOverview).toHaveBeenCalled();
	});
});
