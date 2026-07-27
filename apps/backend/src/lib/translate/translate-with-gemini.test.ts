import { describe, expect, it } from "vitest";

import { stripLeadingLanguageLabel } from "./translate-with-gemini";

/**
 * stripLeadingLanguageLabel のテスト観点表（等価分割・境界値）
 *
 * | # | 観点                                   | 入力                         | 期待結果               |
 * |---|----------------------------------------|------------------------------|------------------------|
 * | 1 | "SPANISH:" + 改行（実際の混入ケース）  | "SPANISH:\nOrganización..."  | "Organización..."      |
 * | 2 | "ENGLISH: " + スペース                 | "ENGLISH: Hello"             | "Hello"                |
 * | 3 | 全角コロン "ESPAÑOL："                  | "ESPAÑOL：Hola"              | "Hola"                 |
 * | 4 | ラベル無し（正常系・素通り）           | "Organización de ideas"      | "Organización de ideas"|
 * | 5 | 未知ラベル "Nota:"（過剰除去しない）   | "Nota: algo importante"      | "Nota: algo importante"|
 * | 6 | 前後の空白のみ（トリムされる）         | "  Hola  "                   | "Hola"                 |
 * | 7 | 途中に出現するラベルは除去しない       | "Texto SPANISH: x"           | "Texto SPANISH: x"     |
 */

describe("stripLeadingLanguageLabel", () => {
	describe("Unit Test", () => {
		it("removes a leading 'SPANISH:' label followed by a newline", () => {
			// Given: 実際に混入した形（言語ラベル + 改行 + 訳文）
			// When: ラベル除去
			const result = stripLeadingLanguageLabel(
				"SPANISH:\nOrganización de ideas"
			);
			// Then: ラベルと前後空白が除去される
			expect(result).toBe("Organización de ideas");
		});

		it("removes a leading 'ENGLISH:' label followed by a space", () => {
			// Given / When
			const result = stripLeadingLanguageLabel("ENGLISH: Hello world");
			// Then
			expect(result).toBe("Hello world");
		});

		it("removes a leading label with a full-width colon", () => {
			// Given: 全角コロンのケース
			// When
			const result = stripLeadingLanguageLabel("ESPAÑOL：Hola");
			// Then
			expect(result).toBe("Hola");
		});

		it("leaves text without a language label unchanged", () => {
			// Given: ラベルの無い正常な訳文
			// When
			const result = stripLeadingLanguageLabel("Organización de ideas");
			// Then: そのまま返る
			expect(result).toBe("Organización de ideas");
		});

		it("does NOT strip an unknown prefix like 'Nota:'", () => {
			// Given: 言語ラベルではない正当な接頭辞
			// When
			const result = stripLeadingLanguageLabel("Nota: algo importante");
			// Then: 過剰除去せずそのまま返る
			expect(result).toBe("Nota: algo importante");
		});

		it("trims surrounding whitespace", () => {
			// Given: 前後に空白のみ
			// When
			const result = stripLeadingLanguageLabel("  Hola  ");
			// Then
			expect(result).toBe("Hola");
		});

		it("does NOT strip a language label that appears mid-text", () => {
			// Given: 先頭以外に現れるラベル
			// When
			const result = stripLeadingLanguageLabel("Texto SPANISH: x");
			// Then: 先頭ではないので除去されない
			expect(result).toBe("Texto SPANISH: x");
		});
	});
});
