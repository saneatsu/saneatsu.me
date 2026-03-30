import { describe, expect, it } from "vitest";

import {
	type AnchorMapping,
	interpolateScrollPosition,
} from "./interpolate-scroll";

describe("Unit Test", () => {
	describe("interpolateScrollPosition", () => {
		describe("正常系", () => {
			it("should interpolate between two anchor points", () => {
				// Given: 2つのアンカーマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 100, previewOffset: 200 },
					{ sourceOffset: 300, previewOffset: 800 },
				];

				// When: 2つのアンカーの中間地点でスクロール
				const result = interpolateScrollPosition(200, mappings, 500, 1000);

				// Then: 線形補間で中間値が計算される
				// t = (200 - 100) / (300 - 100) = 0.5
				// result = 200 + 0.5 * (800 - 200) = 500
				expect(result).toBe(500);
			});

			it("should interpolate at 25% between anchors", () => {
				// Given: 2つのアンカーマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 0, previewOffset: 0 },
					{ sourceOffset: 400, previewOffset: 800 },
				];

				// When: 最初のアンカーから25%の位置でスクロール
				const result = interpolateScrollPosition(100, mappings, 500, 1000);

				// Then: t = 100/400 = 0.25, result = 0 + 0.25 * 800 = 200
				expect(result).toBe(200);
			});

			it("should handle scroll position before first anchor", () => {
				// Given: 最初のアンカーが途中にあるマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 200, previewOffset: 400 },
					{ sourceOffset: 400, previewOffset: 800 },
				];

				// When: 最初のアンカーより手前でスクロール
				const result = interpolateScrollPosition(100, mappings, 500, 1000);

				// Then: 0〜最初のアンカー間で比例計算
				// t = 100 / 200 = 0.5
				// result = 0 + 0.5 * 400 = 200
				expect(result).toBe(200);
			});

			it("should handle scroll position after last anchor", () => {
				// Given: 最後のアンカーが途中にあるマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 100, previewOffset: 200 },
					{ sourceOffset: 300, previewOffset: 600 },
				];
				const editorScrollableHeight = 500;
				const previewScrollableHeight = 1000;

				// When: 最後のアンカーより後ろでスクロール
				const result = interpolateScrollPosition(
					400,
					mappings,
					editorScrollableHeight,
					previewScrollableHeight
				);

				// Then: 最後のアンカー〜末尾間で比例計算
				// t = (400 - 300) / (500 - 300) = 0.5
				// result = 600 + 0.5 * (1000 - 600) = 800
				expect(result).toBe(800);
			});

			it("should return exact preview offset when at anchor point", () => {
				// Given: アンカーマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 100, previewOffset: 250 },
					{ sourceOffset: 300, previewOffset: 700 },
				];

				// When: ちょうどアンカーポイント上でスクロール
				const result = interpolateScrollPosition(100, mappings, 500, 1000);

				// Then: そのアンカーのpreviewOffsetが返される
				expect(result).toBe(250);
			});

			it("should handle three or more anchor points", () => {
				// Given: 3つのアンカーマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 0, previewOffset: 0 },
					{ sourceOffset: 100, previewOffset: 300 },
					{ sourceOffset: 200, previewOffset: 400 },
				];

				// When: 2番目と3番目のアンカー間でスクロール
				const result = interpolateScrollPosition(150, mappings, 300, 600);

				// Then: 2番目と3番目の間で補間
				// t = (150 - 100) / (200 - 100) = 0.5
				// result = 300 + 0.5 * (400 - 300) = 350
				expect(result).toBe(350);
			});

			it("should snap to bottom when editor is scrolled to bottom", () => {
				// Given: アンカーマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 0, previewOffset: 0 },
					{ sourceOffset: 200, previewOffset: 400 },
				];
				const editorScrollableHeight = 500;
				const previewScrollableHeight = 1000;

				// When: エディタが一番下までスクロール
				const result = interpolateScrollPosition(
					editorScrollableHeight,
					mappings,
					editorScrollableHeight,
					previewScrollableHeight
				);

				// Then: プレビューも一番下にスナップ
				expect(result).toBe(previewScrollableHeight);
			});
		});

		describe("異常系・境界値", () => {
			it("should fallback to proportional scrolling when mappings is empty", () => {
				// Given: 空のマッピング
				const mappings: AnchorMapping[] = [];

				// When: スクロール位置を計算
				const result = interpolateScrollPosition(250, mappings, 500, 1000);

				// Then: 単純比例にフォールバック
				// 250 / 500 * 1000 = 500
				expect(result).toBe(500);
			});

			it("should return 0 when scrollTop is 0", () => {
				// Given: アンカーマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 100, previewOffset: 200 },
				];

				// When: スクロール位置が0
				const result = interpolateScrollPosition(0, mappings, 500, 1000);

				// Then: 0が返される
				expect(result).toBe(0);
			});

			it("should handle single anchor point", () => {
				// Given: 1つだけのアンカーマッピング
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 200, previewOffset: 500 },
				];

				// When: アンカーより前でスクロール
				const result = interpolateScrollPosition(100, mappings, 400, 1000);

				// Then: 0〜アンカー間で比例計算
				// t = 100 / 200 = 0.5
				// result = 0 + 0.5 * 500 = 250
				expect(result).toBe(250);
			});

			it("should handle editorScrollableHeight of 0", () => {
				// Given: エディタがスクロール不要な場合
				const mappings: AnchorMapping[] = [];

				// When: editorScrollableHeightが0
				const result = interpolateScrollPosition(0, mappings, 0, 100);

				// Then: 0が返される
				expect(result).toBe(0);
			});

			it("should handle previewScrollableHeight of 0", () => {
				// Given: プレビューがスクロール不要な場合
				const mappings: AnchorMapping[] = [];

				// When: previewScrollableHeightが0
				const result = interpolateScrollPosition(100, mappings, 500, 0);

				// Then: 0が返される
				expect(result).toBe(0);
			});

			it("should clamp result to previewScrollableHeight", () => {
				// Given: 末尾のアンカー以降の範囲が小さいケース
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 0, previewOffset: 0 },
					{ sourceOffset: 100, previewOffset: 900 },
				];

				// When: 大きなスクロール値
				const result = interpolateScrollPosition(500, mappings, 500, 1000);

				// Then: previewScrollableHeightを超えない
				expect(result).toBeLessThanOrEqual(1000);
			});
		});
	});
});
