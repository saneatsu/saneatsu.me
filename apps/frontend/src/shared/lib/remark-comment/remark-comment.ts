import type { Plugin } from "unified";
import type { Node } from "unist";
import { SKIP, visit } from "unist-util-visit";

interface HtmlNode extends Node {
	type: "html";
	value?: string;
}

interface TextNode extends Node {
	type: "text";
	value?: string;
}

interface ParentNode extends Node {
	children: Node[];
}

const COMMENT_PATTERN = /^<!--([\s\S]*?)-->$/;

function hasStringValue(node: Node): node is Node & { value: string } {
	return typeof (node as { value?: unknown }).value === "string";
}

function isCommentNode(node: Node): node is HtmlNode {
	return (
		node.type === "html" &&
		hasStringValue(node) &&
		COMMENT_PATTERN.test(node.value.trim())
	);
}

function isWhitespaceText(node: Node): node is TextNode {
	return (
		node.type === "text" && hasStringValue(node) && node.value.trim() === ""
	);
}

/**
 * HTMLコメントを除去する remark プラグイン
 *
 * @description
 * Markdown 中の `<!-- comment -->` 形式はコメントとして扱い、
 * レンダリング対象から取り除く。
 */
export const remarkComment: Plugin = () => {
	return (tree: Node) => {
		// 1. コメントノードを除去
		visit(tree, "html", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;
			if (!isCommentNode(node)) return;

			(parent as ParentNode).children.splice(index, 1);
			return [SKIP, index];
		});

		// 2. コメントのみで構成される段落を削除
		visit(tree, "paragraph", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;

			const paragraph = node as ParentNode;
			const hasContent = paragraph.children.some(
				(child) => !isWhitespaceText(child)
			);

			if (!hasContent) {
				(parent as ParentNode).children.splice(index, 1);
				return [SKIP, index];
			}
		});
	};
};
