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

interface RakutenNode extends Node {
	type: "rakuten";
	data: {
		hName: "rakuten";
		hProperties: {
			url: string;
			domain: string;
		};
	};
}

interface ParentNode extends Node {
	children: Node[];
}

/**
 * 楽天URLかどうかを判定する正規表現
 *
 * @description
 * 楽天アフィリエイトのURLを検出する。
 * 対応する形式：
 * - https://a.r10.to/XXXXX (短縮URL)
 * - https://hb.afl.rakuten.co.jp/... (通常アフィリエイトリンク)
 * - https://item.rakuten.co.jp/... (商品ページ直リンク)
 */
const rakutenRegex =
	/^https?:\/\/(?:a\.r10\.to|hb\.afl\.rakuten\.co\.jp|(?:item|books|product)\.rakuten\.co\.jp)/;

/**
 * 楽天URLかどうかを判定する
 *
 * @param url - チェック対象のURL
 * @returns 楽天URLの場合はtrue
 */
export function isRakutenUrl(url: string): boolean {
	return rakutenRegex.test(url);
}

/**
 * 楽天URLからドメインを抽出する
 *
 * @description
 * 楽天URLからドメイン（a.r10.to、hb.afl.rakuten.co.jp など）を抽出する。
 * 短縮URLとアフィリエイトリンクに対応。
 *
 * @param url - 楽天URL
 * @returns ドメイン（例: "a.r10.to", "hb.afl.rakuten.co.jp"）
 */
export function extractRakutenDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace("www.", "");
	} catch {
		return "rakuten.co.jp"; // デフォルト
	}
}

/**
 * remark用の楽天商品埋め込みプラグイン
 *
 * @description
 * 楽天商品URLを検出して、カスタムのrakutenノードに変換する。
 * 以下の形式のURLに対応：
 * - https://a.r10.to/XXXXX (短縮URL)
 * - https://hb.afl.rakuten.co.jp/... (アフィリエイトリンク)
 * - https://item.rakuten.co.jp/... (商品ページ)
 *
 * @features
 * 1. 段落内の単独の楽天リンクを楽天商品カードに変換
 * 2. ドメインを抽出してdata属性に保存
 * 3. 他のテキストと混在している場合は通常のリンクとして扱う
 *
 * @example
 * // マークダウン
 * https://a.r10.to/hF6JlM
 *
 * // 変換後
 * <rakuten url="https://a.r10.to/hF6JlM" domain="a.r10.to" />
 *
 * @example
 * // マークダウン（アフィリエイトリンク）
 * https://hb.afl.rakuten.co.jp/ichiba/...
 *
 * // 変換後
 * <rakuten url="https://hb.afl.rakuten.co.jp/ichiba/..." domain="hb.afl.rakuten.co.jp" />
 */
export const remarkRakuten: Plugin = () => {
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

				// 楽天URLを検出
				if (!isRakutenUrl(url)) return;

				// ドメインを抽出
				const domain = extractRakutenDomain(url);

				// rakutenノードに変換
				const rakutenNode: RakutenNode = {
					type: "rakuten",
					data: {
						hName: "rakuten",
						hProperties: {
							url,
							domain,
						},
					},
				};

				// 親ノードの子要素を置き換え
				(parent as ParentNode).children[index] = rakutenNode;
			}
		);
	};
};
