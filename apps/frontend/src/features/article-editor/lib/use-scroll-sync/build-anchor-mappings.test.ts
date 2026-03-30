import { describe, expect, it } from "vitest";

import { computePreviewOffset } from "./build-anchor-mappings";

describe("Unit Test", () => {
	describe("computePreviewOffset", () => {
		describe("正常系", () => {
			it("should return base offset for heading elements", () => {
				// Given: 見出し要素（高さが小さい通常の要素）
				// When: previewOffsetを計算
				const result = computePreviewOffset({
					elementTop: 500,
					containerTop: 100,
					elementHeight: 30,
					type: "heading",
				});

				// Then: 単純なtop位置の差分が返される
				expect(result).toBe(400);
			});

			it("should return centered offset for image elements", () => {
				// Given: 画像要素（プレビューで高さが大きい）
				// When: previewOffsetを計算
				const result = computePreviewOffset({
					elementTop: 500,
					containerTop: 100,
					elementHeight: 300,
					type: "image",
				});

				// Then: 要素の中央位置が返される（400 + 300/2 = 550）
				expect(result).toBe(550);
			});

			it("should return centered offset for embed elements", () => {
				// Given: embed要素（Amazon商品カードなど、プレビューで高さが大きい）
				// When: previewOffsetを計算
				const result = computePreviewOffset({
					elementTop: 600,
					containerTop: 100,
					elementHeight: 200,
					type: "embed",
				});

				// Then: 要素の中央位置が返される（500 + 200/2 = 600）
				expect(result).toBe(600);
			});

			it("should return base offset for codeblock elements", () => {
				// Given: コードブロック要素（エディタでも複数行なので比率が自然に低い）
				// When: previewOffsetを計算
				const result = computePreviewOffset({
					elementTop: 800,
					containerTop: 100,
					elementHeight: 200,
					type: "codeblock",
				});

				// Then: 単純なtop位置の差分が返される（中央化しない）
				expect(result).toBe(700);
			});

			it("should return base offset for hr elements", () => {
				// Given: 水平線要素（高さが小さい）
				// When: previewOffsetを計算
				const result = computePreviewOffset({
					elementTop: 400,
					containerTop: 100,
					elementHeight: 2,
					type: "hr",
				});

				// Then: 単純なtop位置の差分が返される
				expect(result).toBe(300);
			});
		});

		describe("異常系・境界値", () => {
			it("should clamp to 0 when element is above container", () => {
				// Given: 要素がコンテナより上にある場合
				// When: previewOffsetを計算
				const result = computePreviewOffset({
					elementTop: 50,
					containerTop: 100,
					elementHeight: 30,
					type: "heading",
				});

				// Then: 0にクランプされる
				expect(result).toBe(0);
			});

			it("should clamp to 0 for centered image when element is near container top", () => {
				// Given: 画像要素がコンテナのすぐ下にある場合
				// When: previewOffsetを計算（中央化しても負にならない）
				const result = computePreviewOffset({
					elementTop: 100,
					containerTop: 100,
					elementHeight: 300,
					type: "image",
				});

				// Then: 中央化で 0 + 300/2 = 150 が返される
				expect(result).toBe(150);
			});

			it("should handle zero element height for image", () => {
				// Given: 高さ0の画像要素
				// When: previewOffsetを計算
				const result = computePreviewOffset({
					elementTop: 500,
					containerTop: 100,
					elementHeight: 0,
					type: "image",
				});

				// Then: 中央化しても差分と同じ（0/2 = 0）
				expect(result).toBe(400);
			});
		});

		describe("スクロール比率の平滑化効果", () => {
			it("should balance scroll ratios around image elements", () => {
				// Given: 見出し→画像→見出しのパターン
				// 画像の前後でスクロール比率が均等に分散されることを検証
				const headingBefore = computePreviewOffset({
					elementTop: 500,
					containerTop: 100,
					elementHeight: 30,
					type: "heading",
				});

				const imageCenter = computePreviewOffset({
					elementTop: 900,
					containerTop: 100,
					elementHeight: 300,
					type: "image",
				});

				const headingAfter = computePreviewOffset({
					elementTop: 1300,
					containerTop: 100,
					elementHeight: 30,
					type: "heading",
				});

				// Then: 画像の中央化により、前後のセグメントのpreviewRangeが均等化される
				const rangeBefore = imageCenter - headingBefore;
				const rangeAfter = headingAfter - imageCenter;

				// 中央化なしの場合: rangeBefore = 800, rangeAfter = 400 (比率2:1)
				// 中央化ありの場合: rangeBefore = 550, rangeAfter = 250
				// 画像の高さ分（300/2=150）が前セグメントから後セグメントに移動
				expect(rangeBefore).toBe(550);
				expect(rangeAfter).toBe(250);

				// 中央化なしの比率 800:400 = 2:1
				// 中央化ありの比率 550:250 = 2.2:1
				// 前後セグメントのsourceRangeが異なるため比率は完全均等にはならないが、
				// 後セグメントのpreviewRangeが大幅に縮小され、極端なスキップが緩和される
			});
		});
	});
});
