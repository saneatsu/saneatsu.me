import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * タグをHTMLに変換するremarkプラグイン
 *
 * @description
 * Markdown内の#タグ（例：#React、#プログラミング）を
 * 特別なHTMLクラス付きのspan要素に変換する
 */
export const remarkTag: Plugin<[], any> = () => {
	return (tree: any) => {
		visit(tree, "text", (node: any, index, parent: any) => {
			if (!parent || typeof index !== "number") return;

			const value = node.value as string;
			// タグパターン: #で始まり、空白・改行まで続く文字列
			const tagPattern = /#([^\s\n\r\t]+)/g;
			const matches = [...value.matchAll(tagPattern)];

			if (matches.length === 0) return;

			const children: any[] = [];
			let lastIndex = 0;

			for (const match of matches) {
				const matchIndex = match.index!;
				const tagName = match[1];

				// タグ前のテキスト
				if (matchIndex > lastIndex) {
					children.push({
						type: "text",
						value: value.slice(lastIndex, matchIndex),
					});
				}

				// タグをHTMLノードとして追加
				children.push({
					type: "html",
					value: `<span class="tag-link">#${tagName}</span>`,
				});

				lastIndex = matchIndex + match[0].length;
			}

			// 残りのテキスト
			if (lastIndex < value.length) {
				children.push({
					type: "text",
					value: value.slice(lastIndex),
				});
			}

			// 親ノードの子を置き換え
			parent.children.splice(index, 1, ...children);
		});
	};
};
