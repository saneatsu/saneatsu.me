import { describe, expect, it } from "vitest";

import { getThisMonthRangeJst } from "./get-this-month-range";

describe("getThisMonthRangeJst", () => {
	describe("Unit Test", () => {
		it("月央の日時から、JSTの月初〜翌月初（排他上限）をUTC ISO文字列で返す", () => {
			// Given: JST 2025-11-15 09:00 に相当するUTC日時
			const now = new Date("2025-11-15T00:00:00.000Z");

			// When
			const range = getThisMonthRangeJst(now);

			// Then: JST 11月の範囲。月初はUTCでは10/31 15:00
			expect(range).toEqual({
				start: "2025-10-31T15:00:00.000Z",
				end: "2025-11-30T15:00:00.000Z",
			});
		});

		it("UTCではまだ前月末だが、JSTでは翌月に入っている境界を正しく翌月として扱う", () => {
			// Given: UTCは10/31だが、JSTでは既に11/01 00:30
			const now = new Date("2025-10-31T15:30:00.000Z");

			// When
			const range = getThisMonthRangeJst(now);

			// Then: JSTの月＝11月として集計される
			expect(range).toEqual({
				start: "2025-10-31T15:00:00.000Z",
				end: "2025-11-30T15:00:00.000Z",
			});
		});

		it("JST月初の1秒前は前月として扱う（境界値-1）", () => {
			// Given: JST 2025-10-31 23:59:59
			const now = new Date("2025-10-31T14:59:59.000Z");

			// When
			const range = getThisMonthRangeJst(now);

			// Then: JSTの月＝10月
			expect(range).toEqual({
				start: "2025-09-30T15:00:00.000Z",
				end: "2025-10-31T15:00:00.000Z",
			});
		});

		it("JST月初ちょうどは当月として扱う（境界値0）", () => {
			// Given: JST 2025-11-01 00:00:00
			const now = new Date("2025-10-31T15:00:00.000Z");

			// When
			const range = getThisMonthRangeJst(now);

			// Then: JSTの月＝11月
			expect(range).toEqual({
				start: "2025-10-31T15:00:00.000Z",
				end: "2025-11-30T15:00:00.000Z",
			});
		});

		it("年を跨ぐ場合（JST 12月→翌年1月）も正しく計算する", () => {
			// Given: UTCは2025/12/31だが、JSTでは2026/01/01 05:00
			const now = new Date("2025-12-31T20:00:00.000Z");

			// When
			const range = getThisMonthRangeJst(now);

			// Then: JSTの月＝2026年1月
			expect(range).toEqual({
				start: "2025-12-31T15:00:00.000Z",
				end: "2026-01-31T15:00:00.000Z",
			});
		});

		it("12月は翌月の上限が翌年1月になる", () => {
			// Given: JST 2025-12-15 09:00
			const now = new Date("2025-12-15T00:00:00.000Z");

			// When
			const range = getThisMonthRangeJst(now);

			// Then: JSTの月＝12月、上限は翌年1/1(JST)＝12/31 15:00(UTC)
			expect(range).toEqual({
				start: "2025-11-30T15:00:00.000Z",
				end: "2025-12-31T15:00:00.000Z",
			});
		});
	});
});
