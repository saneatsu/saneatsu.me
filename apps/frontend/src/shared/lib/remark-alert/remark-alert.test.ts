import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Node } from "unist";
import { describe, expect, it } from "vitest";

import { remarkAlert } from "./remark-alert";

/**
 * AlertNodeの型定義（テスト用）
 */
interface AlertNode extends Node {
	type: "alert";
	data: {
		hName: string;
		hProperties: {
			variant: "default" | "info" | "success" | "warning" | "destructive";
			title?: string;
		};
	};
	children: Node[];
}

/**
 * ParentNodeの型定義（テスト用）
 */
interface ParentNode extends Node {
	children: Node[];
}

describe("Integration Test", () => {
	describe("remarkAlert plugin", () => {
		it("[!NOTE]をdefault variantのalertノードに変換する", async () => {
			const markdown = "> [!NOTE]\n> これは通常のメモなのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("default");
			expect(alert.data.hProperties.title).toBeUndefined();
		});

		it("[!INFO]をinfo variantのalertノードに変換する", async () => {
			const markdown = "> [!INFO]\n> これは情報メッセージなのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("info");
		});

		it("[!SUCCESS]をsuccess variantのalertノードに変換する", async () => {
			const markdown = "> [!SUCCESS]\n> これは成功メッセージなのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("success");
		});

		it("[!WARNING]をwarning variantのalertノードに変換する", async () => {
			const markdown = "> [!WARNING]\n> これは警告メッセージなのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("warning");
		});

		it("[!DANGER]をdestructive variantのalertノードに変換する", async () => {
			const markdown = "> [!DANGER]\n> これは危険メッセージなのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("destructive");
		});

		it("タイトル付きの[!INFO]を正しく変換する", async () => {
			const markdown = "> [!INFO] 重要な情報\n> 詳細な説明文なのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("info");
			expect(alert.data.hProperties.title).toBe("重要な情報");
		});

		it("複数段落のコンテンツを含むalertを正しく変換する", async () => {
			const markdown =
				"> [!WARNING] 注意事項\n> 最初の段落なのだ。\n>\n> 2番目の段落なのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("warning");
			expect(alert.data.hProperties.title).toBe("注意事項");
		});

		it("remarkBreaksと組み合わせても正しく動作する", async () => {
			const markdown = "> [!INFO]\n> これは情報メッセージなのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkBreaks)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alertノード1つのみになることを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("alert");

			// プロパティの検証
			const alert = result.children[0] as AlertNode;
			expect(alert.data.hProperties.variant).toBe("info");
		});

		it("通常のblockquote（[!TYPE]パターンなし）は変換しない", async () => {
			const markdown = "> これは通常の引用なのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// blockquoteノードのまま変換されないことを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("blockquote");
		});

		it("サポートされていないTYPEは変換しない", async () => {
			const markdown = "> [!UNKNOWN]\n> これは未知のタイプなのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// blockquoteノードのまま変換されないことを確認
			expect(result.children).toHaveLength(1);
			expect(result.children[0]?.type).toBe("blockquote");
		});

		it("複数のalertが連続する場合、それぞれ独立して変換する", async () => {
			const markdown =
				"> [!NOTE]\n> 最初のメモなのだ。\n\n> [!WARNING]\n> 2番目の警告なのだ。";

			const processor = unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkAlert);

			const ast = processor.parse(markdown);
			const result = (await processor.run(ast)) as ParentNode;

			// alert ノードが2つあることを確認
			expect(result.children).toHaveLength(2);
			expect(result.children[0]?.type).toBe("alert");
			expect(result.children[1]?.type).toBe("alert");

			// それぞれのvariantを検証
			const alert1 = result.children[0] as AlertNode;
			const alert2 = result.children[1] as AlertNode;
			expect(alert1.data.hProperties.variant).toBe("default");
			expect(alert2.data.hProperties.variant).toBe("warning");
		});
	});
});
