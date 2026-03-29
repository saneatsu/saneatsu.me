import { describe, expect, it } from "vitest";

import { SLUG_REGEX } from "./slug";

describe("SLUG_REGEX", () => {
	describe("Unit Test", () => {
		describe("正常系", () => {
			it.each([
				// Given: 英字のみのスラッグ
				// When: 正規表現でバリデーション
				// Then: マッチする
				{ input: "typescript", description: "英字のみ" },
				// Given: 英数字混在のスラッグ
				{ input: "next14", description: "英数字混在" },
				// Given: ハイフン区切りのスラッグ
				{ input: "web-development", description: "ハイフン区切り" },
				// Given: 複数ハイフン区切りのスラッグ
				{ input: "my-tag-123", description: "複数ハイフン区切り" },
				// Given: 1文字のスラッグ
				{ input: "a", description: "1文字（英字）" },
				// Given: 数字のみのスラッグ
				{ input: "123", description: "数字のみ" },
				// Given: 1文字の数字
				{ input: "0", description: "1文字（数字）" },
			])("$description: '$input' はマッチする", ({ input }) => {
				expect(SLUG_REGEX.test(input)).toBe(true);
			});
		});

		describe("異常系", () => {
			it.each([
				// Given: ハイフン始まりのスラッグ
				// When: 正規表現でバリデーション
				// Then: マッチしない
				{ input: "-typescript", description: "ハイフン始まり" },
				// Given: ハイフン終わりのスラッグ
				{ input: "typescript-", description: "ハイフン終わり" },
				// Given: 連続ハイフンのスラッグ
				{ input: "web--dev", description: "連続ハイフン" },
				// Given: 大文字を含むスラッグ
				{ input: "TypeScript", description: "大文字" },
				// Given: アンダースコアを含むスラッグ
				{ input: "web_dev", description: "アンダースコア" },
				// Given: スペースを含むスラッグ
				{ input: "web dev", description: "スペース" },
				// Given: 日本語を含むスラッグ
				{ input: "タグ", description: "日本語" },
				// Given: 空文字
				{ input: "", description: "空文字" },
				// Given: ハイフンのみ
				{ input: "-", description: "ハイフンのみ" },
				// Given: ドットを含むスラッグ
				{ input: "web.dev", description: "ドット" },
				// Given: 先頭と末尾の両方がハイフン
				{ input: "-web-dev-", description: "先頭・末尾ハイフン" },
				// Given: 連続ハイフンが複数
				{ input: "a---b", description: "3連続ハイフン" },
			])("$description: '$input' はマッチしない", ({ input }) => {
				expect(SLUG_REGEX.test(input)).toBe(false);
			});
		});
	});
});
