import { describe, expect, it } from "vitest";

import { extractAnchorPoints } from "./extract-anchor-points";

describe("Unit Test", () => {
	describe("extractAnchorPoints", () => {
		describe("正常系", () => {
			it("should extract heading anchor points with correct line numbers", () => {
				// Given: 見出しを含むMarkdown
				const markdown = `# はじめに

本文テキスト

## インストール

### 必要な環境`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 3つの見出しアンカーが正しい行番号で抽出される
				const headings = result.filter((p) => p.type === "heading");
				expect(headings).toHaveLength(3);
				expect(headings[0]).toEqual({
					sourceLine: 0,
					type: "heading",
					headingId: "はじめに",
					headingLevel: 1,
				});
				expect(headings[1]).toEqual({
					sourceLine: 4,
					type: "heading",
					headingId: "インストール",
					headingLevel: 2,
				});
				expect(headings[2]).toEqual({
					sourceLine: 6,
					type: "heading",
					headingId: "必要な環境",
					headingLevel: 3,
				});
			});

			it("should extract image anchor points", () => {
				// Given: 画像を含むMarkdown
				const markdown = `テキスト

![image](https://example.com/img.png)

もう一つ

![photo](https://example.com/photo.jpg)`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 2つの画像アンカーが抽出される
				const images = result.filter((p) => p.type === "image");
				expect(images).toHaveLength(2);
				expect(images[0]).toEqual({
					sourceLine: 2,
					type: "image",
				});
				expect(images[1]).toEqual({
					sourceLine: 6,
					type: "image",
				});
			});

			it("should extract codeblock anchor points", () => {
				// Given: コードブロックを含むMarkdown
				const markdown = `テキスト

\`\`\`typescript
const x = 1;
\`\`\`

もう一つ

\`\`\`
hello
\`\`\``;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 2つのコードブロックアンカーが抽出される
				const codeblocks = result.filter((p) => p.type === "codeblock");
				expect(codeblocks).toHaveLength(2);
				expect(codeblocks[0]).toEqual({
					sourceLine: 2,
					type: "codeblock",
				});
				expect(codeblocks[1]).toEqual({
					sourceLine: 8,
					type: "codeblock",
				});
			});

			it("should extract embed anchor points for card-type URL patterns", () => {
				// Given: カード型としてレンダリングされるURLを含むMarkdown
				const markdown = `テキスト

https://amzn.to/4uJgJKv

https://item.rakuten.co.jp/shop/item123

https://amazon.co.jp/dp/xxx

https://example.com/some-page`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 4つの埋め込みアンカーが抽出される（すべてカード型）
				const embeds = result.filter((p) => p.type === "embed");
				expect(embeds).toHaveLength(4);
				expect(embeds[0]).toEqual({ sourceLine: 2, type: "embed" });
				expect(embeds[1]).toEqual({ sourceLine: 4, type: "embed" });
				expect(embeds[2]).toEqual({ sourceLine: 6, type: "embed" });
				expect(embeds[3]).toEqual({ sourceLine: 8, type: "embed" });
			});

			it("should extract hr anchor points", () => {
				// Given: 水平線を含むMarkdown
				const markdown = `テキスト

---

もう一つ

---`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 2つのhrアンカーが抽出される
				const hrs = result.filter((p) => p.type === "hr");
				expect(hrs).toHaveLength(2);
				expect(hrs[0]).toEqual({ sourceLine: 2, type: "hr" });
				expect(hrs[1]).toEqual({ sourceLine: 6, type: "hr" });
			});

			it("should handle mixed content with correct line numbers", () => {
				// Given: ユーザーが提示したサンプルに近いMarkdown
				const markdown = `### ものは基本的に外に出さない

これが一番大事。

### ものを買わない

例えば

### 床のケアをちゃんとする

次の家ではフロアタイルを敷くことにした。

https://amzn.to/4uJgJKv

### スリッパは履かない`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 見出しと埋め込みが正しい行番号で抽出される
				expect(result).toEqual([
					{
						sourceLine: 0,
						type: "heading",
						headingId: "ものは基本的に外に出さない",
						headingLevel: 3,
					},
					{
						sourceLine: 4,
						type: "heading",
						headingId: "ものを買わない",
						headingLevel: 3,
					},
					{
						sourceLine: 8,
						type: "heading",
						headingId: "床のケアをちゃんとする",
						headingLevel: 3,
					},
					{ sourceLine: 12, type: "embed" },
					{
						sourceLine: 14,
						type: "heading",
						headingId: "スリッパは履かない",
						headingLevel: 3,
					},
				]);
			});

			it("should handle duplicate heading IDs", () => {
				// Given: 同名見出しが複数存在するMarkdown
				const markdown = `## セクション

テキスト

## セクション

テキスト

## セクション`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 重複IDは連番が付与される
				const headings = result.filter((p) => p.type === "heading");
				expect(headings[0]?.headingId).toBe("セクション");
				expect(headings[1]?.headingId).toBe("セクション-1");
				expect(headings[2]?.headingId).toBe("セクション-2");
			});

			it("should not extract non-card embed URLs (Twitter, YouTube, SpeakerDeck, Google Maps)", () => {
				// Given: iframeとしてレンダリングされるURL（a.not-proseにならない）
				const markdown = `テキスト

https://twitter.com/user/status/123

https://x.com/user/status/456

https://www.youtube.com/watch?v=abc

https://youtu.be/abc123

https://speakerdeck.com/user/slide

https://www.google.com/maps/place/Tokyo`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 非カード型のURLは埋め込みアンカーとして検出されない
				const embeds = result.filter((p) => p.type === "embed");
				expect(embeds).toHaveLength(0);
			});

			it("should not extract image URLs as embed anchors", () => {
				// Given: 画像拡張子を持つURL
				const markdown = `テキスト

https://example.com/photo.jpg

https://example.com/image.png

https://example.com/pic.webp

https://example.com/icon.svg?v=2`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 画像URLは埋め込みアンカーとして検出されない
				const embeds = result.filter((p) => p.type === "embed");
				expect(embeds).toHaveLength(0);
			});
		});

		describe("異常系・境界値", () => {
			it("should return empty array for empty string", () => {
				// Given: 空文字列
				// When: アンカーポイントを抽出
				const result = extractAnchorPoints("");

				// Then: 空配列が返される
				expect(result).toEqual([]);
			});

			it("should return empty array for text-only markdown", () => {
				// Given: 構造的要素を含まないMarkdown
				const markdown = `ただのテキストです。
改行もあります。
でも見出しも画像もありません。`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 空配列が返される
				expect(result).toEqual([]);
			});

			it("should skip headings inside code blocks", () => {
				// Given: コードブロック内に見出し記法があるMarkdown
				const markdown = `## 本物の見出し

\`\`\`markdown
## これは見出しではない
### これも見出しではない
\`\`\`

## もう一つの本物の見出し`;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: コードブロック内の見出しは除外される
				const headings = result.filter((p) => p.type === "heading");
				expect(headings).toHaveLength(2);
				expect(headings[0]?.headingId).toBe("本物の見出し");
				expect(headings[1]?.headingId).toBe("もう一つの本物の見出し");
			});

			it("should skip images inside code blocks", () => {
				// Given: コードブロック内に画像記法があるMarkdown
				const markdown = `![real](https://example.com/real.png)

\`\`\`
![fake](https://example.com/fake.png)
\`\`\``;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: コードブロック内の画像は除外される
				const images = result.filter((p) => p.type === "image");
				expect(images).toHaveLength(1);
				expect(images[0]?.sourceLine).toBe(0);
			});

			it("should skip embed URLs inside code blocks", () => {
				// Given: コードブロック内にURLがあるMarkdown
				const markdown = `https://amzn.to/4uJgJKv

\`\`\`
https://amzn.to/another
\`\`\``;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: コードブロック内のURLは除外される
				const embeds = result.filter((p) => p.type === "embed");
				expect(embeds).toHaveLength(1);
				expect(embeds[0]?.sourceLine).toBe(0);
			});

			it("should not extract inline images as anchor points", () => {
				// Given: インライン画像を含むMarkdown（行の途中に画像がある）
				const markdown =
					"テキスト ![inline](https://example.com/img.png) テキスト";

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: インライン画像はアンカーポイントにならない（行頭でないため）
				const images = result.filter((p) => p.type === "image");
				expect(images).toHaveLength(0);
			});

			it("should not extract URLs that are part of text as embed anchors", () => {
				// Given: テキスト内にURLが含まれるMarkdown（URLだけの行ではない）
				const markdown = "参考: https://example.com/page を見てください";

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: テキストの一部としてのURLはアンカーポイントにならない
				const embeds = result.filter((p) => p.type === "embed");
				expect(embeds).toHaveLength(0);
			});

			it("should handle heading with markdown links", () => {
				// Given: リンクを含む見出しのMarkdown
				const markdown = "## [Getting Started](https://example.com)";

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: リンクテキストのみがIDとして使われる
				const headings = result.filter((p) => p.type === "heading");
				expect(headings).toHaveLength(1);
				expect(headings[0]?.headingId).toBe("getting-started");
			});

			it("should return anchor points sorted by line number", () => {
				// Given: 様々な要素が混在するMarkdown
				const markdown = `## 見出し1

![image](https://example.com/img.png)

---

### 見出し2

https://amzn.to/test

\`\`\`ts
code
\`\`\``;

				// When: アンカーポイントを抽出
				const result = extractAnchorPoints(markdown);

				// Then: 行番号順にソートされている
				for (let i = 1; i < result.length; i++) {
					expect(result[i].sourceLine).toBeGreaterThan(
						result[i - 1].sourceLine
					);
				}
			});
		});
	});
});
