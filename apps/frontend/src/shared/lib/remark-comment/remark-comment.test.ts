import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import { remarkComment } from "./remark-comment";

interface RootNode {
	type: "root";
	children: Array<{
		type: string;
		value?: string;
		children?: RootNode["children"];
	}>;
}

describe("remarkComment", () => {
	const processor = unified().use(remarkParse).use(remarkComment);

	it("単独のHTMLコメントを削除する", async () => {
		const markdown = "<!-- draft -->";
		const ast = processor.parse(markdown);
		const result = (await processor.run(ast)) as RootNode;

		expect(result.children).toHaveLength(0);
	});

	it("インラインコメントだけ除去して前後のテキストを残す", async () => {
		const markdown = "Hello <!-- hide -->world";
		const ast = processor.parse(markdown);
		const result = (await processor.run(ast)) as RootNode;

		expect(result.children).toHaveLength(1);
		const paragraph = result.children[0];
		expect(paragraph.type).toBe("paragraph");
		expect(
			paragraph.children?.map((child) => child.value?.trim()).join(" ")
		).toContain("Hello");
		expect(
			paragraph.children?.map((child) => child.value?.trim()).join(" ")
		).toContain("world");
	});

	it("コメントと空白だけの段落を削除する", async () => {
		const markdown = "before\n\n<!-- hidden -->\n\nafter";
		const ast = processor.parse(markdown);
		const result = (await processor.run(ast)) as RootNode;

		expect(result.children).toHaveLength(2);
		expect(result.children[0].type).toBe("paragraph");
		expect(result.children[1].type).toBe("paragraph");
	});
});
