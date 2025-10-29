import { describe, expect, it } from "vitest";

import { extractAmazonAsin, extractAmazonDomain } from "./remark-amazon";

describe("Unit Test", () => {
	describe("extractAmazonAsin", () => {
		it("amazon.co.jp/dp/形式からASINを抽出できる", () => {
			const url = "https://www.amazon.co.jp/dp/B08N5WRWNW";
			const result = extractAmazonAsin(url);
			expect(result).toBe("B08N5WRWNW");
		});

		it("amazon.co.jp/gp/product/形式からASINを抽出できる", () => {
			const url = "https://www.amazon.co.jp/gp/product/B08N5WRWNW";
			const result = extractAmazonAsin(url);
			expect(result).toBe("B08N5WRWNW");
		});

		it("商品名付きのdp/形式からASINを抽出できる", () => {
			const url =
				"https://www.amazon.co.jp/PlayStation-5-デジタル・エディション/dp/B08N5WRWNW";
			const result = extractAmazonAsin(url);
			expect(result).toBe("B08N5WRWNW");
		});

		it("amazon.com（米国）のURLからASINを抽出できる", () => {
			const url = "https://www.amazon.com/dp/B08N5WRWNW";
			const result = extractAmazonAsin(url);
			expect(result).toBe("B08N5WRWNW");
		});

		it("amazon.co.uk（英国）のURLからASINを抽出できる", () => {
			const url = "https://www.amazon.co.uk/dp/B08N5WRWNW";
			const result = extractAmazonAsin(url);
			expect(result).toBe("B08N5WRWNW");
		});

		it("クエリパラメータ付きのURLからASINを抽出できる", () => {
			const url =
				"https://www.amazon.co.jp/dp/B08N5WRWNW?psc=1&ref=ppx_yo2ov_dt_b_product_details";
			const result = extractAmazonAsin(url);
			expect(result).toBe("B08N5WRWNW");
		});

		it("Amazon以外のURLの場合nullを返す", () => {
			const url = "https://example.com/product";
			const result = extractAmazonAsin(url);
			expect(result).toBeNull();
		});

		it("無効なAmazon URLの場合nullを返す", () => {
			const url = "https://www.amazon.co.jp/invalid";
			const result = extractAmazonAsin(url);
			expect(result).toBeNull();
		});

		it("ASINが10桁でない場合nullを返す", () => {
			const url = "https://www.amazon.co.jp/dp/INVALID";
			const result = extractAmazonAsin(url);
			expect(result).toBeNull();
		});

		it("amzn.to短縮URLの場合nullを返す", () => {
			const url = "https://amzn.to/3ABC123";
			const result = extractAmazonAsin(url);
			expect(result).toBeNull();
		});

		it("amzn.asia短縮URLの場合nullを返す", () => {
			const url = "https://amzn.asia/d/abc123";
			const result = extractAmazonAsin(url);
			expect(result).toBeNull();
		});
	});

	describe("extractAmazonDomain", () => {
		it("amazon.co.jpドメインを抽出できる", () => {
			const url = "https://www.amazon.co.jp/dp/B08N5WRWNW";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amazon.co.jp");
		});

		it("amazon.comドメインを抽出できる", () => {
			const url = "https://www.amazon.com/dp/B08N5WRWNW";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amazon.com");
		});

		it("amazon.co.ukドメインを抽出できる", () => {
			const url = "https://www.amazon.co.uk/dp/B08N5WRWNW";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amazon.co.uk");
		});

		it("amazon.deドメインを抽出できる", () => {
			const url = "https://www.amazon.de/dp/B08N5WRWNW";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amazon.de");
		});

		it("wwwプレフィックスを削除する", () => {
			const url = "https://www.amazon.co.jp/dp/B08N5WRWNW";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amazon.co.jp");
		});

		it("無効なURLの場合デフォルトを返す", () => {
			const url = "invalid-url";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amazon.co.jp");
		});

		it("amzn.to短縮URLドメインを抽出できる", () => {
			const url = "https://amzn.to/3ABC123";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amzn.to");
		});

		it("amzn.asia短縮URLドメインを抽出できる", () => {
			const url = "https://amzn.asia/d/abc123";
			const result = extractAmazonDomain(url);
			expect(result).toBe("amzn.asia");
		});
	});
});
