import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Nodeの型定義を拡張
 */
interface TextNode extends Node {
	type: "text";
	value: string;
}

interface LinkNode extends Node {
	type: "link";
	url: string;
	children: Node[];
	data?: {
		hProperties?: {
			className?: string[];
			"data-url-card"?: string;
		};
	};
}

interface ParagraphNode extends Node {
	type: "paragraph";
	children: Node[];
	data?: {
		hName?: string;
		hProperties?: Record<string, unknown>;
	};
}

/**
 * 画像URLかどうかを判定
 */
const isImageUrl = (url: string): boolean => {
	const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
	const lowerUrl = url.toLowerCase();
	return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
};

/**
 * remark用のURLカードプラグイン
 *
 * @description
 * 独立した行にあるURLをカード形式で表示する
 *
 * ルール：
 * - パラグラフが単一のURLのみを含む場合にカード化
 * - 画像URLは除外
 * - 前後に空白があってもOK
 *
 * @example
 * https://feature-sliced.github.io/ → カード表示
 * これは https://example.com/ のリンクです → 通常のリンクとして表示
 * https://example.com/image.png → 画像として表示
 */
export const remarkUrlCard: Plugin = () => {
	return (tree: Node) => {
		visit(tree, "paragraph", (node: Node) => {
			if (node.type !== "paragraph") return;

			const paragraphNode = node as ParagraphNode;

			// パラグラフ内の子ノードが1つのリンクのみかチェック
			if (paragraphNode.children.length !== 1) return;
			const child = paragraphNode.children[0];
			if (child.type !== "link") return;

			const linkNode = child as LinkNode;

			// リンク内のテキストを取得
			const linkText = linkNode.children
				.filter((c) => c.type === "text")
				.map((c) => (c as TextNode).value)
				.join("")
				.trim();

			// リンクのhrefとテキストが同じかチェック（自動リンク化されたURL）
			const url = linkNode.url;

			if (!url || linkText !== url) return;

			// URLの正規表現パターン
			const urlPattern = /^https?:\/\/[^\s]+$/;
			if (!urlPattern.test(url)) return;

			// 画像URLは除外
			if (isImageUrl(url)) return;

			// パラグラフを div に変換（<p> 内に <div> を入れることができないため）
			paragraphNode.data = paragraphNode.data || {};
			paragraphNode.data.hName = "div";

			// リンクノードにURLカードマークを追加
			linkNode.data = linkNode.data || {};
			linkNode.data.hProperties = linkNode.data.hProperties || {};
			linkNode.data.hProperties.className = ["url-card-link"];
			linkNode.data.hProperties["data-url-card"] = url;
		});
	};
};
