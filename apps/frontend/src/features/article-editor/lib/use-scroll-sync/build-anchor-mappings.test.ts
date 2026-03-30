import { describe, expect, it } from "vitest";

import { createMappingsForAnchor } from "./build-anchor-mappings";

describe("Unit Test", () => {
	describe("createMappingsForAnchor", () => {
		describe("正常系: 非画像要素（heading, codeblock, hr）", () => {
			it("should return single top-offset mapping for heading", () => {
				// Given: 見出し要素
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "heading",
					sourceOffset: 260,
					nextLineSourceOffset: 280,
					elementTop: 500,
					containerTop: 100,
					elementHeight: 30,
				});

				// Then: TOP位置の単一マッピングが返される
				expect(result).toEqual([{ sourceOffset: 260, previewOffset: 400 }]);
			});

			it("should return single top-offset mapping for codeblock", () => {
				// Given: コードブロック要素（エディタでも複数行なので比率が自然に低い）
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "codeblock",
					sourceOffset: 300,
					nextLineSourceOffset: 320,
					elementTop: 800,
					containerTop: 100,
					elementHeight: 200,
				});

				// Then: TOP位置の単一マッピング（中央化しない）
				expect(result).toEqual([{ sourceOffset: 300, previewOffset: 700 }]);
			});

			it("should return single top-offset mapping for hr", () => {
				// Given: 水平線要素
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "hr",
					sourceOffset: 400,
					nextLineSourceOffset: 420,
					elementTop: 600,
					containerTop: 100,
					elementHeight: 2,
				});

				// Then: TOP位置の単一マッピング
				expect(result).toEqual([{ sourceOffset: 400, previewOffset: 500 }]);
			});
		});

		describe("正常系: 画像/embed要素（TOP + BOTTOMの2アンカー）", () => {
			it("should return two mappings for image with wrapping URL", () => {
				// Given: 長いURLが3ビジュアル行に折り返される画像
				// sourceOffset=380 (line N), nextLineSourceOffset=440 (line N+1, 折り返し分60px)
				// プレビューで400px高の画像
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "image",
					sourceOffset: 380,
					nextLineSourceOffset: 440,
					elementTop: 1000,
					containerTop: 100,
					elementHeight: 400,
				});

				// Then: TOP + BOTTOMの2つのマッピングが返される
				// TOP: (380, 900) - 画像の上端
				// BOTTOM: (440, 1300) - 画像の下端
				expect(result).toEqual([
					{ sourceOffset: 380, previewOffset: 900 },
					{ sourceOffset: 440, previewOffset: 1300 },
				]);
			});

			it("should return two mappings for embed element", () => {
				// Given: Amazon商品カード（embed）
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "embed",
					sourceOffset: 500,
					nextLineSourceOffset: 520,
					elementTop: 1400,
					containerTop: 100,
					elementHeight: 80,
				});

				// Then: TOP + BOTTOMの2つのマッピング
				expect(result).toEqual([
					{ sourceOffset: 500, previewOffset: 1300 },
					{ sourceOffset: 520, previewOffset: 1380 },
				]);
			});

			it("should allow smooth scroll through tall image", () => {
				// Given: 折り返しURLの画像（エディタで60px、プレビューで400px）
				const result = createMappingsForAnchor({
					type: "image",
					sourceOffset: 380,
					nextLineSourceOffset: 440,
					elementTop: 1000,
					containerTop: 100,
					elementHeight: 400,
				});

				// Then: TOPとBOTTOMの間のsourceRangeが折り返し分の幅を持つ
				// これにより画像セグメントの比率は 400/60 ≈ 6.7 で、
				// 折り返しURLをスクロールする間に画像がtop→bottomと段階的に表示される
				const sourceRange = result[1].sourceOffset - result[0].sourceOffset;
				const previewRange = result[1].previewOffset - result[0].previewOffset;
				expect(sourceRange).toBe(60);
				expect(previewRange).toBe(400);
			});
		});

		describe("異常系・境界値", () => {
			it("should fallback to center offset when nextLineSourceOffset equals sourceOffset", () => {
				// Given: 画像のURLが折り返されない場合（次の行の位置が同じ）
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "image",
					sourceOffset: 380,
					nextLineSourceOffset: 380,
					elementTop: 1000,
					containerTop: 100,
					elementHeight: 400,
				});

				// Then: 中央位置の単一マッピングにフォールバック
				expect(result).toEqual([{ sourceOffset: 380, previewOffset: 1100 }]);
			});

			it("should fallback to center offset when nextLineSourceOffset is undefined", () => {
				// Given: 画像がファイル末尾にある場合（次の行が存在しない）
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "image",
					sourceOffset: 500,
					nextLineSourceOffset: undefined,
					elementTop: 800,
					containerTop: 100,
					elementHeight: 300,
				});

				// Then: 中央位置の単一マッピングにフォールバック
				expect(result).toEqual([{ sourceOffset: 500, previewOffset: 850 }]);
			});

			it("should clamp previewOffset to 0 when element is above container", () => {
				// Given: 要素がコンテナより上にある場合
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "heading",
					sourceOffset: 0,
					nextLineSourceOffset: 20,
					elementTop: 50,
					containerTop: 100,
					elementHeight: 30,
				});

				// Then: 0にクランプ
				expect(result).toEqual([{ sourceOffset: 0, previewOffset: 0 }]);
			});

			it("should handle zero element height for image", () => {
				// Given: 高さ0の画像要素（読み込み前など）
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "image",
					sourceOffset: 380,
					nextLineSourceOffset: 440,
					elementTop: 1000,
					containerTop: 100,
					elementHeight: 0,
				});

				// Then: 高さ0なのでTOP=BOTTOMになるが2つのマッピングを返す
				expect(result).toEqual([
					{ sourceOffset: 380, previewOffset: 900 },
					{ sourceOffset: 440, previewOffset: 900 },
				]);
			});

			it("should not return bottom anchor with negative previewOffset", () => {
				// Given: 要素がコンテナの先頭付近にある画像
				// When: マッピングを生成
				const result = createMappingsForAnchor({
					type: "image",
					sourceOffset: 0,
					nextLineSourceOffset: 60,
					elementTop: 100,
					containerTop: 100,
					elementHeight: 300,
				});

				// Then: TOP=0, BOTTOM=300
				expect(result).toEqual([
					{ sourceOffset: 0, previewOffset: 0 },
					{ sourceOffset: 60, previewOffset: 300 },
				]);
			});
		});
	});
});
