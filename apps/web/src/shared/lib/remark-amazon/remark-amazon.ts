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

interface AmazonNode extends Node {
	type: "amazon";
	data: {
		hName: "amazon";
		hProperties: {
			url: string;
			asin?: string;
			domain: string;
		};
	};
}

interface ParentNode extends Node {
	children: Node[];
}

/**
 * Amazon URLからASIN（Amazon Standard Identification Number）を抽出する
 *
 * @description
 * 様々な形式のAmazon URLからASIN（10桁の英数字）を抽出する。
 * 対応する形式：
 * - https://www.amazon.co.jp/dp/ASIN
 * - https://www.amazon.co.jp/gp/product/ASIN
 * - https://www.amazon.co.jp/product-name/dp/ASIN
 * - https://www.amazon.com/dp/ASIN
 *
 * @param url - Amazon URL
 * @returns ASIN、またはnull
 */
export function extractAmazonAsin(url: string): string | null {
	// /dp/ASIN 形式
	const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
	if (dpMatch) return dpMatch[1];

	// /gp/product/ASIN 形式
	const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/);
	if (gpMatch) return gpMatch[1];

	return null;
}

/**
 * Amazon URLからドメインを抽出する
 *
 * @description
 * Amazon URLからドメイン（amazon.co.jp、amazon.com、amzn.to など）を抽出する。
 * 国別のAmazonサイトと短縮URLに対応。
 *
 * @param url - Amazon URL
 * @returns ドメイン（例: "amazon.co.jp", "amzn.to"）
 */
export function extractAmazonDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace("www.", "");
	} catch {
		return "amazon.co.jp"; // デフォルト
	}
}

/**
 * remark用のAmazon商品埋め込みプラグイン
 *
 * @description
 * Amazon商品URLを検出して、カスタムのamazonノードに変換する。
 * 以下の形式のURLに対応：
 * - https://www.amazon.co.jp/dp/ASIN
 * - https://www.amazon.co.jp/gp/product/ASIN
 * - https://www.amazon.co.jp/product-name/dp/ASIN
 * - https://www.amazon.com/dp/ASIN (他国のAmazonも対応)
 *
 * @features
 * 1. 段落内の単独のAmazonリンクをAmazon商品カードに変換
 * 2. ASINとドメインを抽出してdata属性に保存
 * 3. 他のテキストと混在している場合は通常のリンクとして扱う
 *
 * @example
 * // マークダウン
 * https://www.amazon.co.jp/dp/B08N5WRWNW
 *
 * // 変換後
 * <amazon url="https://www.amazon.co.jp/dp/B08N5WRWNW" asin="B08N5WRWNW" domain="amazon.co.jp" />
 *
 * @example
 * // マークダウン（商品名付きURL）
 * https://www.amazon.co.jp/product-name/dp/B08N5WRWNW
 *
 * // 変換後
 * <amazon url="https://www.amazon.co.jp/product-name/dp/B08N5WRWNW" asin="B08N5WRWNW" domain="amazon.co.jp" />
 */
export const remarkAmazon: Plugin = () => {
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

				// Amazon URLを検出（通常のAmazonサイトと短縮URL）
				const amazonRegex =
					/^https?:\/\/(?:(?:www\.)?amazon\.(?:com|co\.jp|co\.uk|de|fr|it|es|ca|com\.au|in|com\.br|com\.mx|cn|sg|ae|nl|se|pl|com\.tr)|amzn\.(?:to|asia))/;
				if (!amazonRegex.test(url)) return;

				// ASINを抽出（短縮URLの場合はnullになる）
				const asin = extractAmazonAsin(url);

				// ドメインを抽出
				const domain = extractAmazonDomain(url);

				// amazonノードに変換（ASINはオプショナル）
				const amazonNode: AmazonNode = {
					type: "amazon",
					data: {
						hName: "amazon",
						hProperties: {
							url,
							...(asin && { asin }), // ASINがある場合のみ追加
							domain,
						},
					},
				};

				// 親ノードの子要素を置き換え
				(parent as ParentNode).children[index] = amazonNode;
			}
		);
	};
};
