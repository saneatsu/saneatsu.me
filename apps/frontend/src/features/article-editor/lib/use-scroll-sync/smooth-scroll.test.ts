import { describe, expect, it } from "vitest";

import { computeSmoothScrollTop } from "./smooth-scroll";

describe("Unit Test", () => {
	describe("computeSmoothScrollTop", () => {
		describe("正常系", () => {
			it("should snap to target when difference is very small", () => {
				// Given: 現在位置と目標位置の差がごくわずか（< 1px）
				// When: スムーズスクロール位置を計算
				const result = computeSmoothScrollTop(100, 100.5);

				// Then: 目標位置にスナップする
				expect(result).toBe(100.5);
			});

			it("should move toward target by a fraction for small differences", () => {
				// Given: 通常のテキストスクロール（差分50px以内）
				// When: スムーズスクロール位置を計算
				const result = computeSmoothScrollTop(100, 130);

				// Then: 目標位置に直接移動する（小さな差分は即座に反映）
				expect(result).toBe(130);
			});

			it("should limit movement for large differences (image sections)", () => {
				// Given: 画像セグメントでの大きなジャンプ（差分300px）
				// When: スムーズスクロール位置を計算
				const result = computeSmoothScrollTop(100, 400);

				// Then: 一気にジャンプせず、部分的にしか移動しない
				expect(result).toBeGreaterThan(100);
				expect(result).toBeLessThan(400);
			});

			it("should handle negative scroll direction (scrolling up)", () => {
				// Given: 上方向へのスクロール（差分が負）
				// When: スムーズスクロール位置を計算
				const result = computeSmoothScrollTop(400, 100);

				// Then: 目標方向に部分的に移動する
				expect(result).toBeLessThan(400);
				expect(result).toBeGreaterThan(100);
			});

			it("should move more per frame for larger differences", () => {
				// Given: 両方とも閾値超の異なるサイズの差分
				const smallDiff = computeSmoothScrollTop(100, 400);
				const largeDiff = computeSmoothScrollTop(100, 800);

				// Then: 差分が大きいほど1フレームあたりの移動量も大きい
				const smallStep = smallDiff - 100;
				const largeStep = largeDiff - 100;
				expect(largeStep).toBeGreaterThan(smallStep);
			});

			it("should converge to target after multiple iterations", () => {
				// Given: 大きな差分（画像セグメント）
				let current = 100;
				const target = 500;

				// When: 20フレーム分のスムージングを適用
				for (let i = 0; i < 20; i++) {
					current = computeSmoothScrollTop(current, target);
				}

				// Then: 目標位置に十分近づいている
				expect(Math.abs(current - target)).toBeLessThan(1);
			});
		});

		describe("異常系・境界値", () => {
			it("should return target when current equals target", () => {
				// Given: 現在位置 = 目標位置
				// When: スムーズスクロール位置を計算
				const result = computeSmoothScrollTop(200, 200);

				// Then: 目標位置がそのまま返される
				expect(result).toBe(200);
			});

			it("should handle zero values", () => {
				// Given: 現在位置0、目標位置0
				// When: スムーズスクロール位置を計算
				const result = computeSmoothScrollTop(0, 0);

				// Then: 0が返される
				expect(result).toBe(0);
			});

			it("should handle scrolling from zero", () => {
				// Given: 0から大きな値へのスクロール
				// When: スムーズスクロール位置を計算
				const result = computeSmoothScrollTop(0, 300);

				// Then: 部分的に移動する
				expect(result).toBeGreaterThan(0);
				expect(result).toBeLessThan(300);
			});
		});

		describe("スムージング閾値", () => {
			it("should not smooth differences within threshold", () => {
				// Given: 閾値以内の差分（通常テキストのスクロール）
				const result = computeSmoothScrollTop(100, 150);

				// Then: スムージングなしで即座に目標位置に到達
				expect(result).toBe(150);
			});

			it("should smooth differences exceeding threshold", () => {
				// Given: 閾値を超える差分（画像セグメント等）
				const result = computeSmoothScrollTop(100, 350);

				// Then: スムージングが適用され、目標より手前で止まる
				expect(result).toBeLessThan(350);
				expect(result).toBeGreaterThan(100);
			});
		});
	});
});
