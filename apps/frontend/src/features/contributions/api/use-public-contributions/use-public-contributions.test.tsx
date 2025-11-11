import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ContributionSummary } from "@/shared/model";

import { usePublicContributions } from "./use-public-contributions";

const { mockGet } = vi.hoisted(() => ({
	mockGet: vi.fn(),
}));

vi.mock("@/shared/lib", () => ({
	useHonoClient: () => ({
		api: {
			public: {
				contributions: {
					$get: mockGet,
				},
			},
		},
	}),
	queryKeys: {
		contributions: {
			public: (range?: number, locale?: string) =>
				["contributions", "public", { range, locale }] as const,
		},
	},
	extractErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
}));

vi.mock("next-intl", () => ({
	useLocale: () => "ja",
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("usePublicContributions", () => {
	beforeEach(() => {
		mockGet.mockReset();
	});

	afterEach(() => {
		mockGet.mockReset();
	});

	it("rangeとlocaleを付与して執筆データを取得する", async () => {
		const mockSummary: ContributionSummary = {
			startDate: "2024-11-12",
			endDate: "2025-11-11",
			totalJaChars: 54000,
			maxJaChars: 4000,
			days: [{ date: "2025-11-10", jaChars: 800 }],
			lastUpdated: "2025-11-11T12:00:00Z",
		};

		mockGet.mockResolvedValueOnce({
			ok: true,
			json: async () => mockSummary,
		});

		const { result } = renderHook(
			() => usePublicContributions({ range: 90, locale: "en" }),
			{ wrapper: createWrapper() }
		);

		await waitFor(() => {
			expect(result.current.data).toEqual(mockSummary);
		});

		expect(mockGet).toHaveBeenCalledWith({
			query: { range: "90", locale: "en" },
		});
	});

	it("APIエラーを正しく伝播する", async () => {
		mockGet.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "bad range" }),
		});

		const { result } = renderHook(() => usePublicContributions({ range: 30 }), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe(
				"執筆アクティビティの取得に失敗しました"
			);
		});
	});
});
