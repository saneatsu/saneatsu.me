import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

import {
	extractAmazonAsin,
	extractAmazonDomain,
} from "../remark-amazon/remark-amazon";
import {
	extractRakutenDomain,
	isRakutenUrl,
} from "../remark-rakuten/remark-rakuten";

/**
 * Nodeの型定義を拡張
 */
interface LinkNode extends Node {
	type: "link";
	url: string;
	children: Node[];
}

interface ProductCardNode extends Node {
	type: "productCard";
	data: {
		hName: "productCard";
		hProperties: {
			amazonUrl?: string;
			amazonAsin?: string;
			amazonDomain?: string;
			rakutenUrl?: string;
			rakutenDomain?: string;
		};
	};
}

interface ParentNode extends Node {
	children: Node[];
}

/**
 * Amazon URLかどうかを判定する正規表現
 */
const amazonRegex =
	/^https?:\/\/(?:(?:www\.)?amazon\.(?:com|co\.jp|co\.uk|de|fr|it|es|ca|com\.au|in|com\.br|com\.mx|cn|sg|ae|nl|se|pl|com\.tr)|amzn\.(?:to|asia))/;

/**
 * Amazon URLかどうかを判定する
 *
 * @param url - チェック対象のURL
 * @returns Amazon URLの場合はtrue
 */
function isAmazonUrl(url: string): boolean {
	return amazonRegex.test(url);
}

/**
 * 段落が単独のリンクのみを含むかチェックし、URLを返す
 *
 * @param node - チェック対象のノード
 * @returns リンクURLまたはnull
 */
function getSingleLinkUrl(node: Node): string | null {
	const paragraphNode = node as ParentNode;

	// 段落内にリンクが1つだけで、他のコンテンツがない場合のみ処理
	if (paragraphNode.children.length !== 1) return null;

	const child = paragraphNode.children[0];
	if (child.type !== "link") return null;

	return (child as LinkNode).url;
}

/**
 * remark用の統合商品カード埋め込みプラグイン
 *
 * @description
 * 連続するAmazon URLと楽天URLを検出して、統合ProductCardノードに変換する。
 * remarkAmazonとremarkRakutenよりも前に実行される必要がある。
 *
 * @features
 * 1. 連続する2つの段落をチェック
 * 2. Amazon URL + 楽天URL（順不同）を検出
 * 3. 統合ProductCardノードに変換
 * 4. 単独URLの場合は何もせず、後続のプラグインに処理を任せる
 *
 * @example
 * // マークダウン
 * https://www.amazon.co.jp/dp/B08N5WRWNW
 * https://a.r10.to/hF6JlM
 *
 * // 変換後
 * <productCard
 *   amazonUrl="https://www.amazon.co.jp/dp/B08N5WRWNW"
 *   amazonAsin="B08N5WRWNW"
 *   amazonDomain="amazon.co.jp"
 *   rakutenUrl="https://a.r10.to/hF6JlM"
 *   rakutenDomain="a.r10.to"
 * />
 */
export const remarkProductCard: Plugin = () => {
	return (tree: Node) => {
		const parent = tree as ParentNode;
		const indicesToRemove: number[] = [];

		visit(
			tree,
			"paragraph",
			(node: Node, index: number | undefined, _parent: Node | undefined) => {
				// indexがない、または既に削除対象の場合はスキップ
				if (index === undefined || indicesToRemove.includes(index)) return;

				const currentUrl = getSingleLinkUrl(node);
				if (!currentUrl) return;

				// 次の段落をチェック
				const nextNode = parent.children[index + 1];
				if (!nextNode || nextNode.type !== "paragraph") return;

				const nextUrl = getSingleLinkUrl(nextNode);
				if (!nextUrl) return;

				// Amazon URLと楽天URLのペアを検出（順不同）
				let amazonUrl: string | undefined;
				let rakutenUrl: string | undefined;

				if (isAmazonUrl(currentUrl) && isRakutenUrl(nextUrl)) {
					amazonUrl = currentUrl;
					rakutenUrl = nextUrl;
				} else if (isRakutenUrl(currentUrl) && isAmazonUrl(nextUrl)) {
					rakutenUrl = currentUrl;
					amazonUrl = nextUrl;
				} else {
					// ペアでない場合は何もしない
					return;
				}

				// Amazon情報を抽出
				const amazonAsin = amazonUrl ? extractAmazonAsin(amazonUrl) : undefined;
				const amazonDomain = amazonUrl
					? extractAmazonDomain(amazonUrl)
					: undefined;

				// 楽天情報を抽出
				const rakutenDomain = rakutenUrl
					? extractRakutenDomain(rakutenUrl)
					: undefined;

				// ProductCardノードを作成
				const productCardNode: ProductCardNode = {
					type: "productCard",
					data: {
						hName: "productCard",
						hProperties: {
							amazonUrl,
							...(amazonAsin && { amazonAsin }),
							...(amazonDomain && { amazonDomain }),
							rakutenUrl,
							...(rakutenDomain && { rakutenDomain }),
						},
					},
				};

				// 現在のノードを置き換え
				parent.children[index] = productCardNode;

				// 次のノードを削除対象としてマーク
				indicesToRemove.push(index + 1);
			}
		);

		// 削除対象のノードを削除（降順でインデックスを処理）
		for (const indexToRemove of indicesToRemove.sort((a, b) => b - a)) {
			parent.children.splice(indexToRemove, 1);
		}
	};
};
