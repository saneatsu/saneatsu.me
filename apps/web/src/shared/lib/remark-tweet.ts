import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Nodeの型定義を拡張
 */
interface LinkNode extends Node {
	type: "link";
	url: string;
	children: Node[];
}

interface TweetNode extends Node {
	type: "tweet";
	data: {
		hName: "tweet";
		hProperties: {
			id: string;
		};
	};
}

interface ParentNode extends Node {
	children: Node[];
}

/**
 * remark用のTweet埋め込みプラグイン
 *
 * @description
 * Twitter/XのURLを検出して、カスタムのtweetノードに変換する。
 * 以下の形式のURLに対応：
 * - https://twitter.com/username/status/123456789
 * - https://x.com/username/status/123456789
 * - http://twitter.com/username/status/123456789 (自動的にhttpsに変換)
 * - http://x.com/username/status/123456789 (自動的にhttpsに変換)
 *
 * @features
 * 1. 段落内の単独のTwitter/XリンクをTweet埋め込みに変換
 * 2. ツイートIDを抽出してdata属性に保存
 * 3. 他のテキストと混在している場合は通常のリンクとして扱う
 *
 * @example
 * // マークダウン
 * https://twitter.com/jack/status/20
 *
 * // 変換後
 * <tweet id="20" />
 */
export const remarkTweet: Plugin = () => {
	return (tree: Node) => {
		visit(
			tree,
			"paragraph",
			(node: Node, index: number | undefined, parent: Node | undefined) => {
				if (!parent || index === undefined) return;

				const paragraphNode = node as ParentNode;

				// 段落内にリンクが1つだけで、他のコンテンツがない場合のみ処理
				if (paragraphNode.children.length !== 1) return;

				const child = paragraphNode.children[0];
				if (child.type !== "link") return;

				const linkNode = child as LinkNode;
				const url = linkNode.url;

				// Twitter/XのURLを検出
				// パターン: https?://(twitter\.com|x\.com)/[^/]+/status/(\d+)
				const tweetRegex =
					/^https?:\/\/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/;
				const match = url.match(tweetRegex);

				if (!match) return;

				const tweetId = match[1];

				// tweetノードに変換
				const tweetNode: TweetNode = {
					type: "tweet",
					data: {
						hName: "tweet",
						hProperties: {
							id: tweetId,
						},
					},
				};

				// 親ノードの子要素を置き換え
				(parent as ParentNode).children[index] = tweetNode;
			}
		);
	};
};
