import { describe, expect, it } from "vitest";

import { convertIsoToDatetimeLocal, formatRelativeDate } from "./format-date";

describe("convertIsoToDatetimeLocal", () => {
	describe("Unit Test", () => {
		it("ISO 8601形式の日時文字列をdatetime-local形式に変換する", () => {
			// Arrange: ISO 8601形式の日時文字列を用意
			// Note: このテストはUTCタイムゾーンで実行されることを前提としている
			// ローカルマシンのタイムゾーン設定により結果が異なる場合がある
			const isoString = "2024-01-15T10:30:00.000Z";

			// Act: datetime-local形式に変換
			const result = convertIsoToDatetimeLocal(isoString);

			// Assert: YYYY-MM-DDTHH:mm形式になっていることを確認
			expect(result).toBeTruthy();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
		});

		it("入力がnullの場合はundefinedを返す", () => {
			// Arrange: nullを用意
			const isoString = null;

			// Act: 変換
			const result = convertIsoToDatetimeLocal(isoString);

			// Assert: undefinedが返される
			expect(result).toBeUndefined();
		});

		it("不正な日時文字列の場合はundefinedを返す", () => {
			// Arrange: 不正な日時文字列を用意
			const isoString = "invalid-date-string";

			// Act: 変換
			const result = convertIsoToDatetimeLocal(isoString);

			// Assert: undefinedが返される（エラーハンドリング）
			expect(result).toBeUndefined();
		});

		it("タイムゾーン変換が正しく行われる", () => {
			// Arrange: 特定の日時を用意
			const isoString = "2024-12-25T00:00:00.000Z";

			// Act: 変換
			const result = convertIsoToDatetimeLocal(isoString);

			// Assert: 結果が存在し、正しい形式であることを確認
			expect(result).toBeTruthy();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

			// タイムゾーン変換が行われたことを確認
			// （ローカルタイムゾーンによって結果は異なる）
			const date = new Date(isoString);
			const expectedYear = date.getFullYear();
			const expectedMonth = String(date.getMonth() + 1).padStart(2, "0");
			const expectedDay = String(date.getDate()).padStart(2, "0");

			expect(result).toContain(
				`${expectedYear}-${expectedMonth}-${expectedDay}`
			);
		});

		it("秒・ミリ秒は切り捨てられ、分までの精度が保たれる", () => {
			// Arrange: 秒・ミリ秒を含む日時を用意
			const isoString = "2024-01-15T10:30:45.999Z";

			// Act: 変換
			const result = convertIsoToDatetimeLocal(isoString);

			// Assert: datetime-local形式では秒・ミリ秒が切り捨てられる
			expect(result).toBeTruthy();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
			// 秒が含まれていないことを確認
			expect(result).not.toMatch(/:\d{2}:\d{2}$/);
		});
	});
});

describe("formatRelativeDate", () => {
	describe("Unit Test", () => {
		it("30分前の場合は分数で返す", () => {
			// Arrange: 30分前の日付
			const currentDate = new Date("2024-01-15T10:30:00.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で30分前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.minutes).toBe(30);
		});

		it("1分未満の場合は0分として返す", () => {
			// Arrange: 30秒前の日付
			const currentDate = new Date("2024-01-15T10:00:30.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で0分前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.minutes).toBe(0);
		});

		it("59分前の場合は分数で返す（境界値）", () => {
			// Arrange: 59分前の日付
			const currentDate = new Date("2024-01-15T11:00:00.000Z");
			const isoString = "2024-01-15T10:01:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で59分前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.minutes).toBe(59);
		});

		it("5時間前の場合は時間数で返す", () => {
			// Arrange: 5時間前の日付
			const currentDate = new Date("2024-01-15T15:00:00.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で5時間前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.hours).toBe(5);
		});

		it("23時間前の場合は時間数で返す（境界値）", () => {
			// Arrange: 23時間前の日付
			const currentDate = new Date("2024-01-15T23:00:00.000Z");
			const isoString = "2024-01-15T00:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で23時間前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.hours).toBe(23);
		});

		it("0日前の場合は日数で返す（24時間経過）", () => {
			// Arrange: ちょうど24時間前の日付
			const currentDate = new Date("2024-01-16T10:00:00.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で1日前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.days).toBe(1);
		});

		it("2日前の日付の場合は相対表示で返す", () => {
			// Arrange: 48時間（2日）前の日付
			const currentDate = new Date("2024-01-17T10:00:00.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で2日前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.days).toBe(2);
		});

		it("5日前の日付の場合は相対表示で返す", () => {
			// Arrange: 5日前（120時間前）の日付
			const currentDate = new Date("2024-01-20T10:00:00.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で5日前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.days).toBe(5);
		});

		it("10日前の日付の場合は相対表示で返す（境界値）", () => {
			// Arrange: 10日前（240時間前）の日付（境界値）
			const currentDate = new Date("2024-01-25T10:00:00.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 相対表示で10日前
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(true);
			expect(result?.days).toBe(10);
		});

		it("11日前の日付の場合は通常の日付形式で返す", () => {
			// Arrange: 11日前（264時間前）の日付
			const currentDate = new Date("2024-01-26T10:00:00.000Z");
			const isoString = "2024-01-15T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 通常の日付形式
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(false);
			expect(result?.formatted).toBeDefined();
			expect(result?.formatted).toContain("2024");
			expect(result?.formatted).toContain("1");
			expect(result?.formatted).toContain("15");
		});

		it("30日前の日付の場合は通常の日付形式で返す", () => {
			// Arrange: 30日前の日付
			const currentDate = new Date("2024-01-31T10:00:00.000Z");
			const isoString = "2024-01-01T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: 通常の日付形式
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(false);
			expect(result?.formatted).toBeDefined();
		});

		it("入力がnullの場合はundefinedを返す", () => {
			// Arrange: nullを用意
			const isoString = null;
			const currentDate = new Date("2024-01-15T10:00:00.000Z");

			// Act: 変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: undefinedが返される
			expect(result).toBeUndefined();
		});

		it("不正な日時文字列の場合はundefinedを返す", () => {
			// Arrange: 不正な日時文字列を用意
			const isoString = "invalid-date-string";
			const currentDate = new Date("2024-01-15T10:00:00.000Z");

			// Act: 変換
			const result = formatRelativeDate(isoString, "ja", currentDate);

			// Assert: undefinedが返される
			expect(result).toBeUndefined();
		});

		it("英語ロケールの場合も正しく日付形式を返す", () => {
			// Arrange: 15日前の日付（英語ロケール）
			const currentDate = new Date("2024-01-31T10:00:00.000Z");
			const isoString = "2024-01-16T10:00:00.000Z";

			// Act: 相対日付に変換
			const result = formatRelativeDate(isoString, "en", currentDate);

			// Assert: 通常の日付形式（英語）
			expect(result).toBeDefined();
			expect(result?.isRelative).toBe(false);
			expect(result?.formatted).toBeDefined();
			expect(result?.formatted).toContain("2024");
			expect(result?.formatted).toContain("January");
		});
	});
});
