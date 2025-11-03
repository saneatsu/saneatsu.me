import { describe, expect, it } from "vitest";
import { extractHeadings, slugify } from "./extract-headings";

describe("Unit Test", () => {
	describe("slugify", () => {
		it("日本語文字列をそのまま保持する", () => {
			expect(slugify("はじめに")).toBe("はじめに");
		});

		it("英語文字列を小文字に変換し、スペースをハイフンに置換する", () => {
			expect(slugify("Getting Started")).toBe("getting-started");
		});

		it("日本語と英語が混在する文字列を処理する", () => {
			expect(slugify("React の使い方")).toBe("react-の使い方");
		});

		it("連続するハイフンを1つにまとめる", () => {
			expect(slugify("foo---bar")).toBe("foo-bar");
		});

		it("前後のハイフンを除去する", () => {
			expect(slugify("-foo-bar-")).toBe("foo-bar");
		});
	});

	describe("extractHeadings", () => {
		it("空文字列の場合、空配列を返す", () => {
			expect(extractHeadings("")).toEqual([]);
		});

		it("見出しがない場合、空配列を返す", () => {
			const markdown = "これは普通のテキストです。\n見出しはありません。";
			expect(extractHeadings(markdown)).toEqual([]);
		});

		it("H1見出しを抽出する", () => {
			const markdown = "# はじめに";
			const result = extractHeadings(markdown);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: "はじめに",
				text: "はじめに",
				level: 1,
			});
		});

		it("複数レベルの見出しを抽出する", () => {
			const markdown = `
# はじめに
## インストール
### 必要な環境
## 使い方
`;
			const result = extractHeadings(markdown);

			expect(result).toHaveLength(4);
			expect(result[0].level).toBe(1);
			expect(result[1].level).toBe(2);
			expect(result[2].level).toBe(3);
			expect(result[3].level).toBe(2);
		});

		it("同じテキストの見出しがある場合、IDに連番を付与する", () => {
			const markdown = `
# はじめに
## はじめに
### はじめに
`;
			const result = extractHeadings(markdown);

			expect(result[0].id).toBe("はじめに");
			expect(result[1].id).toBe("はじめに-1");
			expect(result[2].id).toBe("はじめに-2");
		});

		describe("リンク付き見出しの処理", () => {
			it("リンク付き見出しからリンクテキストだけを抽出する", () => {
				const markdown = "# [hoge](https://www.google.com)";
				const result = extractHeadings(markdown);

				expect(result).toHaveLength(1);
				expect(result[0].text).toBe("hoge");
				expect(result[0].id).toBe("hoge");
			});

			it("複数のリンクが含まれる見出しを処理する", () => {
				const markdown =
					"# [foo](https://example.com) と [bar](https://example.org)";
				const result = extractHeadings(markdown);

				expect(result).toHaveLength(1);
				expect(result[0].text).toBe("foo と bar");
			});

			it("リンクとテキストが混在する見出しを処理する", () => {
				const markdown = "# はじめに [公式サイト](https://example.com) を参照";
				const result = extractHeadings(markdown);

				expect(result).toHaveLength(1);
				expect(result[0].text).toBe("はじめに 公式サイト を参照");
			});

			it("リンクがない通常の見出しは変更しない", () => {
				const markdown = "# 普通の見出し";
				const result = extractHeadings(markdown);

				expect(result).toHaveLength(1);
				expect(result[0].text).toBe("普通の見出し");
			});

			it("画像リンク構文は除去する", () => {
				const markdown = "# ![画像の説明](https://example.com/image.png)";
				const result = extractHeadings(markdown);

				expect(result).toHaveLength(1);
				expect(result[0].text).toBe("");
			});

			it("リンクと画像リンクが混在する場合を処理する", () => {
				const markdown =
					"# [テキスト](https://example.com) ![画像](https://example.com/image.png) 追加テキスト";
				const result = extractHeadings(markdown);

				expect(result).toHaveLength(1);
				expect(result[0].text).toBe("テキスト  追加テキスト");
			});
		});
	});
});
