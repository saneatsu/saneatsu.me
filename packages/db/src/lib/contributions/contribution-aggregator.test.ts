import { describe, expect, it } from "vitest";

import {
	calculateJapaneseCharDelta,
	countJapaneseCharactersFromMarkdown,
	toJstDateKey,
} from "./contribution-aggregator";

describe("countJapaneseCharactersFromMarkdown", () => {
	it("Markdown記号も含めすべての文字をカウントできる", () => {
		const markdown = [
			"# 見出し",
			"English line",
			"- 箇条書き",
			"**強調**",
		].join("\n");

		// 改行は除外し 29 文字として扱う
		expect(countJapaneseCharactersFromMarkdown(markdown)).toBe(29);
	});

	it("ASCIIや絵文字も含め全テキストをカウントする", () => {
		const markdown = "今日はSunnyな1日☀️";
		// 絵文字はバリアントセレクタ込みでも 1 文字として扱い 12 を期待
		expect(countJapaneseCharactersFromMarkdown(markdown)).toBe(12);
	});

	it("半角カナや長音符もカウント対象になる", () => {
		const markdown = "ｶﾀｶﾅｰとー";
		// 文字列長そのものを採用し 7 文字として扱う
		expect(countJapaneseCharactersFromMarkdown(markdown)).toBe(7);
	});

	it("URL文字列もフラットにカウントする", () => {
		const url = "https://example.com/記事/詳細?page=1";
		// 文字数そのものを採用し 32 文字として扱う
		expect(countJapaneseCharactersFromMarkdown(url)).toBe(32);
	});
});

describe("calculateJapaneseCharDelta", () => {
	it("前回本文が無い場合は全量を返す", () => {
		const next = "今日はたくさん書いた"; // 10
		expect(calculateJapaneseCharDelta(null, next)).toBe(10);
	});

	it("文字を追加した場合はその差分のみ返す", () => {
		const prev = "こんにちは"; // 5
		const next = "こんにちは世界"; // 7
		expect(calculateJapaneseCharDelta(prev, next)).toBe(2);
	});

	it("削除した場合でも負の値にならない", () => {
		const prev = "ドラフト本文があります"; // 11
		const next = "ドラフト"; // 4
		expect(calculateJapaneseCharDelta(prev, next)).toBe(0);
	});
});

describe("toJstDateKey", () => {
	it("JSTの範囲内なら日付キーは変わらない", () => {
		const utcDate = new Date("2025-11-10T03:00:00Z");
		expect(toJstDateKey(utcDate)).toBe("2025-11-10");
	});

	it("UTC+9hが日付を跨ぐ場合は翌日キーに繰り上がる", () => {
		const utcDate = new Date("2025-11-10T15:30:00Z");
		expect(toJstDateKey(utcDate)).toBe("2025-11-11");
	});

	it("うるう年では2月29日を正しく扱う", () => {
		const utcDate = new Date("2024-02-28T15:30:00Z");
		expect(toJstDateKey(utcDate)).toBe("2024-02-29");
	});
});
it("改行はカウント対象外", () => {
	const text = "一行目\n二行目";
	// 「一行目」(3) + 「二行目」(3) = 6（改行を除外）
	expect(countJapaneseCharactersFromMarkdown(text)).toBe(6);
});
