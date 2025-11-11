import { describe, expect, it, vi } from "vitest";

vi.mock("@saneatsu/db", async () => {
	const actual =
		await vi.importActual<typeof import("@saneatsu/db")>("@saneatsu/db");
	return actual;
});

import type { Database } from "@saneatsu/db/worker";
import { getContributionSummary } from "@/lib/get-contribution-summary";

const createMockDb = (
	rows: Array<{
		date: string;
		jaCharCount: number;
		updatedAt: string;
	}>
) => {
	const whereMock = vi.fn().mockResolvedValue(rows);
	const fromMock = vi.fn().mockReturnValue({
		where: whereMock,
	});
	const selectMock = vi.fn().mockReturnValue({
		from: fromMock,
	});

	return {
		select: selectMock,
	} as unknown as Database;
};

describe("getContributionSummary", () => {
	it("欠損日をゼロ埋めしつつ合計値を計算できる", async () => {
		const db = createMockDb([
			{
				date: "2025-11-10",
				jaCharCount: 500,
				updatedAt: "2025-11-10T09:00:00Z",
			},
			{
				date: "2025-11-11",
				jaCharCount: 200,
				updatedAt: "2025-11-11T08:00:00Z",
			},
		]);

		const summary = await getContributionSummary(db, {
			rangeDays: 3,
			now: new Date("2025-11-11T12:00:00Z"),
		});

		expect(summary.startDate).toBe("2025-11-09");
		expect(summary.endDate).toBe("2025-11-11");
		expect(summary.totalJaChars).toBe(700);
		expect(summary.maxJaChars).toBe(500);
		expect(summary.days).toEqual([
			{ date: "2025-11-09", jaChars: 0 },
			{ date: "2025-11-10", jaChars: 500 },
			{ date: "2025-11-11", jaChars: 200 },
		]);
	});

	it("データが無い場合は現在時刻でlastUpdatedを埋める", async () => {
		const db = createMockDb([]);
		const fixedNow = new Date("2025-11-11T00:00:00Z");

		const summary = await getContributionSummary(db, {
			rangeDays: 2,
			now: fixedNow,
		});

		expect(summary.lastUpdated).toMatch(/^2025-11-11/);
	});
});
