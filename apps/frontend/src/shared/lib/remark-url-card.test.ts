import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import { remarkUrlCard } from "./remark-url-card";

/**
 * Nodeの型定義
 */
interface Node {
	type: string;
	children?: Node[];
	value?: string;
	url?: string;
	data?: {
		hName?: string;
		hProperties?: Record<string, unknown>;
	};
}

interface ParentNode extends Node {
	children: Node[];
}

interface LinkNode extends Node {
	type: "link";
	url: string;
	data?: {
		hProperties?: {
			className?: string[];
			"data-url-card"?: string;
		};
	};
}

interface ParagraphNode extends Node {
	type: "paragraph" | "div";
	data?: {
		hName?: string;
	};
}

describe("Unit Test", () => {
	describe("基本的なURL変換", () => {
		it("単独のHTTPS URLをURLカードに変換できる", async () => {
			const markdown = "https://example.com";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkUrlCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// パラグラフが div に変換されることを確認
			expect(result.children).toHaveLength(1);
			const paragraph = result.children[0] as ParagraphNode;
			expect(paragraph.data?.hName).toBe("div");

			// リンクノードにURLカードマークが追加されることを確認
			const link = paragraph.children?.[0] as LinkNode;
			expect(link.type).toBe("link");
			expect(link.data?.hProperties?.className).toEqual(["url-card-link"]);
			expect(link.data?.hProperties?.["data-url-card"]).toBe(
				"https://example.com"
			);
		});

		it("単独のHTTP URLをURLカードに変換できる", async () => {
			const markdown = "http://example.com";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkUrlCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			expect(result.children).toHaveLength(1);
			const paragraph = result.children[0] as ParagraphNode;
			expect(paragraph.data?.hName).toBe("div");

			const link = paragraph.children?.[0] as LinkNode;
			expect(link.data?.hProperties?.["data-url-card"]).toBe(
				"http://example.com"
			);
		});
	});

	describe("除外パターン", () => {
		it("画像URLはカード化しない", async () => {
			const markdown = "https://example.com/image.png";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkUrlCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			const paragraph = result.children[0] as ParagraphNode;
			expect(paragraph.data?.hName).toBeUndefined();

			const link = paragraph.children?.[0] as LinkNode;
			expect(link.data?.hProperties?.["data-url-card"]).toBeUndefined();
		});

		it("テキストを含むパラグラフはカード化しない", async () => {
			const markdown = "これは https://example.com/ のリンクです";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkUrlCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			const paragraph = result.children[0] as ParagraphNode;
			expect(paragraph.data?.hName).toBeUndefined();
		});
	});

	describe("remarkBreaksとの併用（実際の環境に合わせたテスト）", () => {
		it("remarkBreaks使用時、改行1つで区切られた複数URLをそれぞれ変換できる", async () => {
			// remarkBreaksによって改行がbreakノードに変換される場合のテスト
			// ユーザーの実際のケース：
			// https://ja.wikipedia.org/wiki/...
			// https://www2.nhk.or.jp/...
			//
			// AST構造: paragraph { children: [link, break, link] }
			// 期待動作: 2つの独立したURLカードに分割
			const markdown =
				"https://ja.wikipedia.org/wiki/%E6%AD%A6%E8%80%85%E5%B0%8F%E8%B7%AF%E5%AE%9F%E7%AF%A4\nhttps://www2.nhk.or.jp/archives/articles/?id=D0009070943_00000";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkBreaks) // remarkBreaksを追加（実際の環境と同じ）
				.use(remarkUrlCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 期待: 2つの独立したdivに分割される
			// このテストは失敗するはず（Phase 1: Red）
			expect(result.children).toHaveLength(2);

			// 1つ目のURL
			const div1 = result.children[0] as ParagraphNode;
			expect(div1.data?.hName).toBe("div");
			const link1 = div1.children?.[0] as LinkNode;
			expect(link1.data?.hProperties?.["data-url-card"]).toBe(
				"https://ja.wikipedia.org/wiki/%E6%AD%A6%E8%80%85%E5%B0%8F%E8%B7%AF%E5%AE%9F%E7%AF%A4"
			);

			// 2つ目のURL
			const div2 = result.children[1] as ParagraphNode;
			expect(div2.data?.hName).toBe("div");
			const link2 = div2.children?.[0] as LinkNode;
			expect(link2.data?.hProperties?.["data-url-card"]).toBe(
				"https://www2.nhk.or.jp/archives/articles/?id=D0009070943_00000"
			);
		});

		it("remarkBreaks使用時、改行2つで区切られた単独URLをそれぞれ変換できる", async () => {
			// 改行2つの場合は別々のパラグラフになるので正常に動作するはず
			const markdown =
				"https://ja.wikipedia.org/wiki/Test\n\nhttps://www2.nhk.or.jp/archives/articles/?id=D0009070943_00000";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkBreaks)
				.use(remarkUrlCard);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// 2つの独立したパラグラフになる
			expect(result.children).toHaveLength(2);

			// 1つ目のURL
			const paragraph1 = result.children[0] as ParagraphNode;
			expect(paragraph1.data?.hName).toBe("div");
			const link1 = paragraph1.children?.[0] as LinkNode;
			expect(link1.data?.hProperties?.["data-url-card"]).toBe(
				"https://ja.wikipedia.org/wiki/Test"
			);

			// 2つ目のURL
			const paragraph2 = result.children[1] as ParagraphNode;
			expect(paragraph2.data?.hName).toBe("div");
			const link2 = paragraph2.children?.[0] as LinkNode;
			expect(link2.data?.hProperties?.["data-url-card"]).toBe(
				"https://www2.nhk.or.jp/archives/articles/?id=D0009070943_00000"
			);
		});
	});
});
