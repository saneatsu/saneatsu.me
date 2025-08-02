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
			className?: string;
			style?: string;
		};
	};
}

interface ParentNode extends Node {
	children: Node[];
}

/**
 * remark用のWiki Linkプラグイン
 *
 * @description
 * [[記事スラッグ]] または [[記事スラッグ#アンカー]] 形式のWiki Linkを
 * 通常のMarkdownリンクに変換する
 *
 * @example
 * [[nextjs-basics]] -> [nextjs-basics](/articles/nextjs-basics)
 * [[nextjs-basics#routing]] -> [nextjs-basics#routing](/articles/nextjs-basics#routing)
 */
export const remarkWikiLink: Plugin = () => {
	return (tree: Node) => {
		visit(
			tree,
			"text",
			(node: Node, index: number | undefined, parent: Node | undefined) => {
				if (!parent || index === undefined) return;
				if (node.type !== "text") return;

				const textNode = node as TextNode;
				const parentNode = parent as ParentNode;
				const value = textNode.value;

				// Wiki Link形式の検出: [[スラッグ]] または [[スラッグ#アンカー]]
				const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
				const matches = [...value.matchAll(wikiLinkRegex)];

				if (matches.length === 0) return;

				const newNodes: Node[] = [];
				let lastIndex = 0;

				matches.forEach((match) => {
					const fullMatch = match[0];
					const linkContent = match[1];
					const matchIndex = match.index || 0;

					// マッチ前のテキストを追加
					if (matchIndex > lastIndex) {
						newNodes.push({
							type: "text",
							value: value.slice(lastIndex, matchIndex),
						} as TextNode);
					}

					// リンクコンテンツを解析（スラッグ#アンカー形式に対応）
					let slug = linkContent;
					let anchor = "";
					let displayText = linkContent;

					const anchorMatch = linkContent.match(/^([^#]+)(#.+)$/);
					if (anchorMatch) {
						slug = anchorMatch[1];
						anchor = anchorMatch[2];
						displayText = `${slug}${anchor}`;
					}

					// Wiki Linkをリンクノードに変換
					const linkNode: LinkNode = {
						type: "link",
						url: `/articles/${slug}${anchor}`,
						children: [
							{
								type: "text",
								value: displayText,
							} as TextNode,
						],
						data: {
							hProperties: {
								className: anchor ? "wiki-link wiki-link-anchor" : "wiki-link",
								style: anchor ? "color: #3b82f6;" : undefined,
							},
						},
					};

					newNodes.push(linkNode);
					lastIndex = matchIndex + fullMatch.length;
				});

				// 残りのテキストを追加
				if (lastIndex < value.length) {
					newNodes.push({
						type: "text",
						value: value.slice(lastIndex),
					} as TextNode);
				}

				// 親ノードの子要素を置き換え
				parentNode.children.splice(index, 1, ...newNodes);
			}
		);
	};
};
