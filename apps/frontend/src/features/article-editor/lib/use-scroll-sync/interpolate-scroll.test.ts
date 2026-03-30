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

			it("should keep preview before image when editor is before image section", () => {
				// Given: 実記事に近いアンカーマッピング（見出し3つ → 画像embed → 見出し1つ）
				// sourceOffsetはword-wrapを考慮した正確なビジュアル位置
				// 見出し間のテキスト行がword-wrapで複数行に折り返されるため、
				// sourceOffsetの間隔はpreviewOffsetの間隔より相対的に大きい
				const mappings: AnchorMapping[] = [
					{ sourceOffset: 0, previewOffset: 0 }, // ### ものは基本的に外に出さない
					{ sourceOffset: 120, previewOffset: 200 }, // ### ものを買わない
					{ sourceOffset: 260, previewOffset: 400 }, // ### 床のケアをちゃんとする
					{ sourceOffset: 380, previewOffset: 900 }, // embed: amzn.to（プレビューでは画像が大きい）
					{ sourceOffset: 400, previewOffset: 1100 }, // ### スリッパは履かない
				];
				const editorScrollableHeight = 500;
				const previewScrollableHeight = 1400;

				// When: エディタが「床のケアをちゃんとする」の少し下（画像embedの手前）にいる
				const scrollTop = 300;
				const result = interpolateScrollPosition(
					scrollTop,
					mappings,
					editorScrollableHeight,
					previewScrollableHeight
				);

				// Then: プレビューも画像embed（900）の手前にあるべき
				// 260〜380の間で補間: t = (300-260)/(380-260) = 0.333
				// result = 400 + 0.333 * (900-400) = 566.7
				expect(result).toBeLessThan(900);
				expect(result).toBeGreaterThan(400);
			});

			it("should not overshoot preview when sourceOffsets are correctly spread", () => {
				// Given: sourceOffsetが正確に計測された場合のマッピング
				// スクロールバー幅を差し引いた正しいミラー幅で計測すると、
				// 折り返しが増えてsourceOffset間隔が広がる
				const correctMappings: AnchorMapping[] = [
					{ sourceOffset: 0, previewOffset: 0 },
					{ sourceOffset: 150, previewOffset: 300 },
					{ sourceOffset: 350, previewOffset: 800 },
				];

				// 同じ内容でスクロールバー幅を考慮しなかった場合のマッピング
				// ミラーが広いためword-wrapが少なく、sourceOffsetが過小評価される
				const incorrectMappings: AnchorMapping[] = [
					{ sourceOffset: 0, previewOffset: 0 },
					{ sourceOffset: 120, previewOffset: 300 },
					{ sourceOffset: 280, previewOffset: 800 },
				];

				// When: エディタが中間位置にいる
				const scrollTop = 200;
				const correctResult = interpolateScrollPosition(
					scrollTop,
					correctMappings,
					500,
					1200
				);
				const incorrectResult = interpolateScrollPosition(
					scrollTop,
					incorrectMappings,
					500,
					1200
				);

				// Then: 正しいマッピングの方がプレビュースクロールが控えめになる
				// （sourceOffsetが大きいため、同じscrollTopでも進行率が低い）
				expect(correctResult).toBeLessThan(incorrectResult);
			});
		});
	});
});
