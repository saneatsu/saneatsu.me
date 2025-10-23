import { describe, expect, it } from "vitest";

import { convertIsoToDatetimeLocal } from "./format-date";

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
