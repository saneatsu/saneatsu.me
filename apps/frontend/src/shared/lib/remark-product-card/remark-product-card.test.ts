import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Node } from "unist";
import { describe, expect, it } from "vitest";

import { remarkProductCard } from "./remark-product-card";

/**
 * ProductCardノードの型定義（テスト用）
 */
interface ProductCardNode extends Node {
	type: "productCard";
	data: {
		hName: string;
		hProperties: {
			amazonUrl?: string;
			amazonAsin?: string;
			amazonDomain?: string;
			rakutenUrl?: string;
			rakutenDomain?: string;
		};
	};
}

/**
 * ParentNodeの型定義（テスト用）
 */
interface ParentNode extends Node {
	children: Node[];
}

describe("Integration Test", () => {
	describe("remarkProductCard plugin", () => {
		it("連続するAmazon URL → 楽天URLをproductCardノードに変換する", async () => {
			const markdown =
				"https://www.amazon.co.jp/dp/B08N5WRWNW\n\nhttps://a.r10.to/hF6JlM";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// プロパティの検証
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.amazonUrl).toBe(
				"https://www.amazon.co.jp/dp/B08N5WRWNW"
			);
			expect(productCard.data.hProperties.amazonAsin).toBe("B08N5WRWNW");
			expect(productCard.data.hProperties.amazonDomain).toBe("amazon.co.jp");
			expect(productCard.data.hProperties.rakutenUrl).toBe(
				"https://a.r10.to/hF6JlM"
			);
			expect(productCard.data.hProperties.rakutenDomain).toBe("a.r10.to");
		});

		it("連続する楽天URL → Amazon URLをproductCardノードに変換する（逆順）", async () => {
			const markdown =
				"https://a.r10.to/hF6JlM\n\nhttps://www.amazon.co.jp/dp/B08N5WRWNW";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// プロパティの検証（順番が逆でも同じ結果）
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.amazonUrl).toBe(
				"https://www.amazon.co.jp/dp/B08N5WRWNW"
			);
			expect(productCard.data.hProperties.rakutenUrl).toBe(
				"https://a.r10.to/hF6JlM"
			);
		});

		it("Amazon URLのみの場合は変換しない", async () => {
			const markdown = "https://www.amazon.co.jp/dp/B08N5WRWNW";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 元のparagraphノードのまま（変換されない）
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("paragraph");
		});

		it("楽天URLのみの場合は変換しない", async () => {
			const markdown = "https://a.r10.to/hF6JlM";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 元のparagraphノードのまま（変換されない）
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("paragraph");
		});

		it("連続しないURLは変換しない", async () => {
			const markdown =
				"https://www.amazon.co.jp/dp/B08N5WRWNW\n\nテキスト段落\n\nhttps://a.r10.to/hF6JlM";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 3つのノードが保持される（変換されない）
			expect(result.children).toHaveLength(3);
			expect(result.children[0]?.type).toBe("paragraph");
			expect(result.children[1]?.type).toBe("paragraph");
			expect(result.children[2]?.type).toBe("paragraph");
		});

		it("Amazon URL → Amazon URLは変換しない", async () => {
			const markdown =
				"https://www.amazon.co.jp/dp/B08N5WRWNW\n\nhttps://www.amazon.co.jp/dp/B08N5WRWN1";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 2つのノードが保持される（変換されない）
			expect(result.children).toHaveLength(2);
			expect(result.children[0]?.type).toBe("paragraph");
			expect(result.children[1]?.type).toBe("paragraph");
		});

		it("楽天URL → 楽天URLは変換しない", async () => {
			const markdown = "https://a.r10.to/hF6JlM\n\nhttps://a.r10.to/hF6JlN";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 2つのノードが保持される（変換されない）
			expect(result.children).toHaveLength(2);
			expect(result.children[0]?.type).toBe("paragraph");
			expect(result.children[1]?.type).toBe("paragraph");
		});

		it("複数のAmazon + 楽天ペアをすべて検出する", async () => {
			const markdown =
				"https://www.amazon.co.jp/dp/B08N5WRWNW\n\nhttps://a.r10.to/hF6JlM\n\nテキスト\n\nhttps://www.amazon.co.jp/dp/B08N5WRWN1\n\nhttps://a.r10.to/hF6JlN";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 2つのproductCardノード + 1つのテキスト段落
			expect(result.children).toHaveLength(3);
			expect(result.children[0]?.type).toBe("productCard");
			expect(result.children[1]?.type).toBe("paragraph"); // テキスト
			expect(result.children[2]?.type).toBe("productCard");
		});

		it("長いアフィリエイトURLも正しく処理できる", async () => {
			const markdown =
				"https://www.amazon.co.jp/dp/B08N5WRWNW\n\nhttps://hb.afl.rakuten.co.jp/ichiba/4e068e00.5f53c806.4e068e01.d8b0cd27/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// 楽天の長いURLが正しく格納されていることを確認
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.rakutenUrl).toContain(
				"hb.afl.rakuten.co.jp"
			);
			expect(productCard.data.hProperties.rakutenDomain).toBe(
				"hb.afl.rakuten.co.jp"
			);
		});

		it("短縮URL同士のペアも正しく処理できる", async () => {
			const markdown = "https://amzn.to/3ABC123\n\nhttps://a.r10.to/hF6JlM";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// 短縮URLが正しく格納されていることを確認
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.amazonUrl).toBe(
				"https://amzn.to/3ABC123"
			);
			expect(productCard.data.hProperties.amazonDomain).toBe("amzn.to");
			expect(productCard.data.hProperties.rakutenUrl).toBe(
				"https://a.r10.to/hF6JlM"
			);
			expect(productCard.data.hProperties.rakutenDomain).toBe("a.r10.to");
			// 短縮URLの場合はASINは抽出されない
			expect(productCard.data.hProperties.amazonAsin).toBeUndefined();
		});
	});

	describe("同一段落内の2つのリンク検出（半角スペース/改行1つ）", () => {
		it("半角スペース区切りのAmazon URL → 楽天URLをproductCardノードに変換する", async () => {
			const markdown = "https://amzn.to/43mMbSS https://a.r10.to/hF6JlM";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// プロパティの検証
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.amazonUrl).toBe(
				"https://amzn.to/43mMbSS"
			);
			expect(productCard.data.hProperties.rakutenUrl).toBe(
				"https://a.r10.to/hF6JlM"
			);
		});

		it("半角スペース区切りの楽天URL → Amazon URLをproductCardノードに変換する", async () => {
			const markdown = "https://a.r10.to/hF6JlM https://amzn.to/43mMbSS";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// プロパティの検証（順番が逆でも同じ結果）
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.amazonUrl).toBe(
				"https://amzn.to/43mMbSS"
			);
			expect(productCard.data.hProperties.rakutenUrl).toBe(
				"https://a.r10.to/hF6JlM"
			);
		});

		it("改行1つで区切られたAmazon URL → 楽天URLをproductCardノードに変換する", async () => {
			const markdown = "https://amzn.to/43mMbSS\nhttps://a.r10.to/hF6JlM";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// プロパティの検証
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.amazonUrl).toBe(
				"https://amzn.to/43mMbSS"
			);
			expect(productCard.data.hProperties.rakutenUrl).toBe(
				"https://a.r10.to/hF6JlM"
			);
		});

		it("改行1つで区切られた楽天URL → Amazon URLをproductCardノードに変換する", async () => {
			const markdown = "https://a.r10.to/hF6JlM\nhttps://amzn.to/43mMbSS";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// productCardノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("productCard");

			// プロパティの検証（順番が逆でも同じ結果）
			const productCard = result.children[0] as ProductCardNode;
			expect(productCard.data.hProperties.amazonUrl).toBe(
				"https://amzn.to/43mMbSS"
			);
			expect(productCard.data.hProperties.rakutenUrl).toBe(
				"https://a.r10.to/hF6JlM"
			);
		});

		it("3つ以上のリンクがある場合は変換しない（誤検出防止）", async () => {
			const markdown =
				"https://amzn.to/43mMbSS https://a.r10.to/hF6JlM https://example.com";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 元のparagraphノードのまま（変換されない）
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("paragraph");
		});

		it("リンク + 通常テキスト + リンクは変換しない（誤検出防止）", async () => {
			const markdown = "https://amzn.to/43mMbSS と https://a.r10.to/hF6JlM";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 元のparagraphノードのまま（変換されない）
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("paragraph");
		});

		it("Amazon URL + Amazon URL（半角スペース）は変換しない", async () => {
			const markdown = "https://amzn.to/43mMbSS https://amzn.to/43mMbST";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 元のparagraphノードのまま（変換されない）
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("paragraph");
		});

		it("楽天URL + 楽天URL（半角スペース）は変換しない", async () => {
			const markdown = "https://a.r10.to/hF6JlM https://a.r10.to/hF6JlN";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkProductCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 元のparagraphノードのまま（変換されない）
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("paragraph");
		});
	});
});
