import { describe, expect, it } from "vitest";

import { extractRakutenDomain, isRakutenUrl } from "./remark-rakuten";

describe("Unit Test", () => {
	describe("isRakutenUrl", () => {
		it("短縮URL (a.r10.to) を楽天URLと判定できる", () => {
			const url = "https://a.r10.to/hF6JlM";
			const result = isRakutenUrl(url);
			expect(result).toBe(true);
		});

		it("アフィリエイトリンク (hb.afl.rakuten.co.jp) を楽天URLと判定できる", () => {
			const url =
				"https://hb.afl.rakuten.co.jp/ichiba/4e068e00.5f53c806.4e068e01.d8b0cd27/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F";
			const result = isRakutenUrl(url);
			expect(result).toBe(true);
		});

		it("商品ページ直リンク (item.rakuten.co.jp) を楽天URLと判定できる", () => {
			const url = "https://item.rakuten.co.jp/book/17569477/";
			const result = isRakutenUrl(url);
			expect(result).toBe(true);
		});

		it("商品ページ直リンク (books.rakuten.co.jp) を楽天URLと判定できる", () => {
			const url = "https://books.rakuten.co.jp/rb/12345678/";
			const result = isRakutenUrl(url);
			expect(result).toBe(true);
		});

		it("商品ページ直リンク (product.rakuten.co.jp) を楽天URLと判定できる", () => {
			const url = "https://product.rakuten.co.jp/product/test/";
			const result = isRakutenUrl(url);
			expect(result).toBe(true);
		});

		it("http://プロトコルのURLも楽天URLと判定できる", () => {
			const url = "http://a.r10.to/hF6JlM";
			const result = isRakutenUrl(url);
			expect(result).toBe(true);
		});

		it("Amazon URLは楽天URLと判定しない", () => {
			const url = "https://www.amazon.co.jp/dp/B08N5WRWNW";
			const result = isRakutenUrl(url);
			expect(result).toBe(false);
		});

		it("一般的なURLは楽天URLと判定しない", () => {
			const url = "https://example.com/product";
			const result = isRakutenUrl(url);
			expect(result).toBe(false);
		});

		it("楽天以外のrakuten系URLは楽天URLと判定しない", () => {
			const url = "https://travel.rakuten.co.jp/";
			const result = isRakutenUrl(url);
			expect(result).toBe(false);
		});

		it("空文字列は楽天URLと判定しない", () => {
			const url = "";
			const result = isRakutenUrl(url);
			expect(result).toBe(false);
		});
	});

	describe("extractRakutenDomain", () => {
		it("短縮URLドメイン (a.r10.to) を抽出できる", () => {
			const url = "https://a.r10.to/hF6JlM";
			const result = extractRakutenDomain(url);
			expect(result).toBe("a.r10.to");
		});

		it("アフィリエイトリンクドメイン (hb.afl.rakuten.co.jp) を抽出できる", () => {
			const url =
				"https://hb.afl.rakuten.co.jp/ichiba/test/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F";
			const result = extractRakutenDomain(url);
			expect(result).toBe("hb.afl.rakuten.co.jp");
		});

		it("商品ページドメイン (item.rakuten.co.jp) を抽出できる", () => {
			const url = "https://item.rakuten.co.jp/book/17569477/";
			const result = extractRakutenDomain(url);
			expect(result).toBe("item.rakuten.co.jp");
		});

		it("商品ページドメイン (books.rakuten.co.jp) を抽出できる", () => {
			const url = "https://books.rakuten.co.jp/rb/12345678/";
			const result = extractRakutenDomain(url);
			expect(result).toBe("books.rakuten.co.jp");
		});

		it("商品ページドメイン (product.rakuten.co.jp) を抽出できる", () => {
			const url = "https://product.rakuten.co.jp/product/test/";
			const result = extractRakutenDomain(url);
			expect(result).toBe("product.rakuten.co.jp");
		});

		it("wwwプレフィックスを削除する", () => {
			const url = "https://www.item.rakuten.co.jp/book/17569477/";
			const result = extractRakutenDomain(url);
			expect(result).toBe("item.rakuten.co.jp");
		});

		it("無効なURLの場合デフォルト値を返す", () => {
			const url = "invalid-url";
			const result = extractRakutenDomain(url);
			expect(result).toBe("rakuten.co.jp");
		});

		it("空文字列の場合デフォルト値を返す", () => {
			const url = "";
			const result = extractRakutenDomain(url);
			expect(result).toBe("rakuten.co.jp");
		});
	});
});
