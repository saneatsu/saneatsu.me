import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import {
	extractSpeakerDeckInfo,
	remarkSpeakerdeck,
} from "./remark-speakerdeck";

interface Node {
	type: string;
	children?: Node[];
	value?: string;
	data?: {
		hProperties?: Record<string, unknown>;
	};
}

interface ParentNode extends Node {
	children: Node[];
}

describe("extractSpeakerDeckInfo", () => {
	it("ユーザーとデッキ名を抽出できる", () => {
		const url =
			"https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition";
		const result = extractSpeakerDeckInfo(url);
		expect(result).toEqual({
			deckPath: "twada/quality-and-speed-2022-spring-edition",
		});
	});

	it("クエリパラメータのスライド番号を抽出できる", () => {
		const url =
			"https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition?slide=3";
		const result = extractSpeakerDeckInfo(url);
		expect(result).toEqual({
			deckPath: "twada/quality-and-speed-2022-spring-edition",
			slide: 3,
		});
	});

	it("ハッシュのスライド番号を抽出できる", () => {
		const url =
			"https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition#slide=10";
		const result = extractSpeakerDeckInfo(url);
		expect(result).toEqual({
			deckPath: "twada/quality-and-speed-2022-spring-edition",
			slide: 10,
		});
	});

	it("Speaker Deck以外のURLはnullを返す", () => {
		const url =
			"https://example.com/twada/quality-and-speed-2022-spring-edition";
		const result = extractSpeakerDeckInfo(url);
		expect(result).toBeNull();
	});
});

describe("remarkSpeakerdeck", () => {
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkSpeakerdeck);

	it("単独行のSpeaker Deck URLをspeakerdeckノードへ変換する", async () => {
		const markdown =
			"https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition";
		const ast = processor.parse(markdown);
		const result = (await processor.run(ast)) as ParentNode;

		expect(result.children).toHaveLength(1);
		const node = result.children[0];
		expect(node.type).toBe("speakerdeck");
		expect(node.data?.hProperties).toMatchObject({
			url: "https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition",
			deckPath: "twada/quality-and-speed-2022-spring-edition",
		});
	});

	it("?slide=パラメータ付きURLを変換し、スライド番号を保持する", async () => {
		const markdown =
			"https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition?slide=3";
		const ast = processor.parse(markdown);
		const result = (await processor.run(ast)) as ParentNode;

		const node = result.children[0];
		expect(node.type).toBe("speakerdeck");
		expect(node.data?.hProperties).toMatchObject({
			url: "https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition?slide=3",
			deckPath: "twada/quality-and-speed-2022-spring-edition",
			slide: 3,
		});
	});

	it("手動テキストリンクは変換しない", async () => {
		const markdown =
			"[Speaker Deck](https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition)";
		const ast = processor.parse(markdown);
		const result = (await processor.run(ast)) as ParentNode;

		expect(result.children[0].type).toBe("paragraph");
	});

	it("Speaker Deck以外のURLは変換しない", async () => {
		const markdown =
			"https://example.com/twada/quality-and-speed-2022-spring-edition";
		const ast = processor.parse(markdown);
		const result = (await processor.run(ast)) as ParentNode;

		expect(result.children[0].type).toBe("paragraph");
	});
});
