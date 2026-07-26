import { describe, expect, it } from "vitest";

import { pickMissing } from "./backfill-translations";

/**
 * pickMissing のテスト観点表（等価分割・境界値）
 *
 * existingTargetIds = 既に対象言語（en/es/ko…）の翻訳を持つ ID
 *
 * | # | 観点                          | sources        | existingTargetIds | 期待結果        |
 * |---|-------------------------------|----------------|-------------------|-----------------|
 * | 1 | 一部に対象言語あり（正常系）  | id 1,2,3       | [2]               | id 1,3          |
 * | 2 | 対象言語が全く無い            | id 1,2         | []                | id 1,2（全件）  |
 * | 3 | 全件に対象言語あり            | id 1,2         | [1,2]             | []（空）        |
 * | 4 | sources が空                  | []             | [1]               | []（空）        |
 * | 5 | existingTargetIds に重複      | id 1,2         | [1,1]             | id 2            |
 * | 6 | existingTargetIds に無関係ID  | id 1,2         | [99]              | id 1,2（全件）  |
 * | 7 | getId が別フィールドを参照    | galleryImageId | [10]              | 該当以外        |
 */

type SourceRow = { articleId: number; title: string };

const rows: SourceRow[] = [
	{ articleId: 1, title: "A" },
	{ articleId: 2, title: "B" },
	{ articleId: 3, title: "C" },
];

describe("pickMissing", () => {
	describe("Unit Test", () => {
		it("returns only rows whose id is not in existingEsIds", () => {
			// Given: id 2 だけ es が存在する
			// When: pickMissing で欠けている行を抽出
			const result = pickMissing(rows, [2], (row) => row.articleId);

			// Then: id 1 と 3 が残る
			expect(result).toEqual([
				{ articleId: 1, title: "A" },
				{ articleId: 3, title: "C" },
			]);
		});

		it("returns all rows when no es exists yet", () => {
			// Given: es が1件も存在しない
			// When: 抽出
			const result = pickMissing(rows, [], (row) => row.articleId);

			// Then: 全件が対象になる
			expect(result).toHaveLength(3);
		});

		it("returns an empty array when every row already has es", () => {
			// Given: 全 id に es が存在する
			// When: 抽出
			const result = pickMissing(rows, [1, 2, 3], (row) => row.articleId);

			// Then: 対象は空
			expect(result).toEqual([]);
		});

		it("returns an empty array when sources is empty", () => {
			// Given: ソースが空
			// When: 抽出
			const result = pickMissing<SourceRow>([], [1], (row) => row.articleId);

			// Then: 空配列を返す
			expect(result).toEqual([]);
		});

		it("treats duplicated existingEsIds the same as a single occurrence", () => {
			// Given: existingEsIds に id 1 が重複して含まれる
			// When: 抽出
			const result = pickMissing(
				[
					{ articleId: 1, title: "A" },
					{ articleId: 2, title: "B" },
				],
				[1, 1],
				(row) => row.articleId
			);

			// Then: 重複は影響せず id 2 のみ残る
			expect(result).toEqual([{ articleId: 2, title: "B" }]);
		});

		it("ignores existingEsIds that do not match any source", () => {
			// Given: どのソースにも一致しない id 99
			// When: 抽出
			const result = pickMissing(
				[
					{ articleId: 1, title: "A" },
					{ articleId: 2, title: "B" },
				],
				[99],
				(row) => row.articleId
			);

			// Then: 除外されず全件が残る
			expect(result).toHaveLength(2);
		});

		it("uses the provided getId accessor to read the id field", () => {
			// Given: articleId ではなく galleryImageId を持つ行
			const galleryRows = [
				{ galleryImageId: 10, title: "X" },
				{ galleryImageId: 20, title: "Y" },
			];

			// When: getId で galleryImageId を参照
			const result = pickMissing(
				galleryRows,
				[10],
				(row) => row.galleryImageId
			);

			// Then: id 10 が除外され 20 のみ残る
			expect(result).toEqual([{ galleryImageId: 20, title: "Y" }]);
		});
	});
});
