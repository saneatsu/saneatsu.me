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
 * リンクがURLカードの対象かどうかを判定
 *
 * @description
 * 以下の条件をすべて満たす場合にtrueを返す：
 * - リンク内のテキストとhrefが同じ（自動リンク化されたURL）
 * - URLの形式が正しい（http/https）
 * - 画像URLでない
 *
 * @param linkNode - チェック対象のリンクノード
 * @returns URLカードの対象の場合true
 */
const isValidUrlCard = (linkNode: LinkNode): boolean => {
	// リンク内のテキストを取得
	const linkText = linkNode.children
		.filter((c) => c.type === "text")
		.map((c) => (c as TextNode).value)
		.join("")
		.trim();

	// リンクのhrefとテキストが同じかチェック（自動リンク化されたURL）
	const url = linkNode.url;
	if (!url || linkText !== url) return false;

	// URLの正規表現パターン
	const urlPattern = /^https?:\/\/[^\s]+$/;
	if (!urlPattern.test(url)) return false;

	// 画像URLは除外
	if (isImageUrl(url)) return false;

	return true;
};

/**
 * リンクノードにURLカードプロパティを追加
 *
 * @param linkNode - 対象のリンクノード
 * @returns URLカードプロパティが追加されたリンクノード
 */
const addUrlCardProperties = (linkNode: LinkNode): LinkNode => {
	linkNode.data = linkNode.data || {};
	linkNode.data.hProperties = linkNode.data.hProperties || {};
	linkNode.data.hProperties.className = ["url-card-link"];
	linkNode.data.hProperties["data-url-card"] = linkNode.url;
	return linkNode;
};

/**
 * remark用のURLカードプラグイン
 *
 * @description
 * 独立した行にあるURLをカード形式で表示する
 *
 * ルール：
 * - パラグラフが単一のURLのみを含む場合にカード化
 * - パラグラフ内にbreakノードで区切られた複数のURLがある場合、それぞれをカード化
 * - 画像URLは除外
 * - 前後に空白があってもOK
 *
 * remarkBreaksプラグインとの互換性：
 * - remarkBreaksは改行1つ(\n)を{type: 'break'}ノードに変換する
 * - breakノードを許容することで、実際の環境（MarkdownPreview）でも動作する
 *
 * @example
 * // 単独のURL
 * https://feature-sliced.github.io/ → カード表示
 *
 * @example
 * // 改行1つで区切られた複数のURL（remarkBreaks使用時）
 * https://ja.wikipedia.org/wiki/Test
 * https://www2.nhk.or.jp/...
 * // → それぞれがカード表示
 *
 * @example
 * // 除外パターン
 * これは https://example.com/ のリンクです → 通常のリンクとして表示
 * https://example.com/image.png → 画像として表示
 */
export const remarkUrlCard: Plugin = () => {
	return (tree: Node) => {
		visit(
			tree,
			"paragraph",
			(node: Node, index: number | undefined, parent: Node | undefined) => {
				if (node.type !== "paragraph" || index === undefined || !parent) return;

				const paragraphNode = node as ParagraphNode;
				const parentNode = parent as ParagraphNode;

				// パラグラフ内のリンクとbreakノードを分析
				const validLinks: LinkNode[] = [];
				let hasInvalidContent = false;

				for (const child of paragraphNode.children) {
					if (child.type === "link") {
						const linkNode = child as LinkNode;
						if (isValidUrlCard(linkNode)) {
							validLinks.push(linkNode);
						} else {
							hasInvalidContent = true;
							break;
						}
					} else if (
						child.type === "break" ||
						(child.type === "text" && (child as TextNode).value.trim() === "")
					) {
						// breakノードまたは空白文字のみのテキストは許容
						// （何もしない）
					} else {
						// その他のノード（非空白テキストなど）がある場合は処理しない
						hasInvalidContent = true;
						break;
					}
				}

				// 無効なコンテンツがある場合は処理しない
				if (hasInvalidContent) return;

				// 有効なリンクがない場合は処理しない
				if (validLinks.length === 0) return;

				// 各リンクを個別のdivノードに変換
				const urlCardNodes: ParagraphNode[] = validLinks.map((linkNode) => {
					return {
						type: "paragraph",
						data: { hName: "div" },
						children: [addUrlCardProperties(linkNode)],
					};
				});

				// パラグラフを複数のdivノードに置き換え
				parentNode.children.splice(index, 1, ...urlCardNodes);
			}
		);
	};
};
