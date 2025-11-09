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

interface TextNode extends Node {
	type: "text";
	value: string;
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
 * 段落から2つのリンクURLを取得する（空白文字のみのテキストとbreakノードを許容）
 *
 * @description
 * 半角スペースや改行1つで区切られた2つのURLを検出するために使用。
 * 以下の条件を満たす場合のみ、2つのURLを返す：
 * 1. 段落内にlinkノードが正確に2つ
 * 2. その他のノードはtextノード（空白文字のみ）またはbreakノード
 * 3. 上記以外のノードがある場合や、非空白テキストがある場合はnullを返す
 *
 * remarkBreaksプラグインとの互換性：
 * - remarkBreaksは改行1つ（\n）を{type: 'break'}ノードに変換する
 * - このbreakノードを許容することで、実際の環境（MarkdownPreview）でも動作する
 *
 * @param node - チェック対象の段落ノード
 * @returns [URL1, URL2] または null
 *
 * @example
 * // 半角スペース区切り
 * https://amzn.to/xxx https://a.r10.to/yyy
 * // → ["https://amzn.to/xxx", "https://a.r10.to/yyy"]
 *
 * @example
 * // 改行1つ（remarkBreaksなし）
 * https://amzn.to/xxx
 * https://a.r10.to/yyy
 * // → ["https://amzn.to/xxx", "https://a.r10.to/yyy"]
 *
 * @example
 * // 改行1つ（remarkBreaksあり）
 * https://amzn.to/xxx
 * https://a.r10.to/yyy
 * // → ["https://amzn.to/xxx", "https://a.r10.to/yyy"]
 */
function getTwoLinksFromParagraph(node: Node): [string, string] | null {
	const paragraphNode = node as ParentNode;

	const links: string[] = [];
	let hasNonWhitespaceText = false;

	for (const child of paragraphNode.children) {
		if (child.type === "link") {
			links.push((child as LinkNode).url);
		} else if (child.type === "text") {
			// テキストノードが空白文字のみかチェック
			const textValue = (child as TextNode).value || "";
			if (textValue.trim() !== "") {
				hasNonWhitespaceText = true;
			}
		} else if (child.type === "break") {
			// breakノードは許容（remarkBreaksが改行を変換したもの）
			// 改行1つ（\n）をremarkBreaksが{type: 'break'}ノードに変換する
			// 空白文字と同等の扱いなので何もしない
		} else {
			// link, text, break以外のノードがある場合は処理しない
			return null;
		}
	}

	// リンクが正確に2つで、非空白テキストがない場合のみ処理
	if (links.length === 2 && !hasNonWhitespaceText) {
		return [links[0], links[1]];
	}

	return null;
}

/**
 * remark用の統合商品カード埋め込みプラグイン
 *
 * @description
 * Amazon URLと楽天URLのペアを検出して、統合ProductCardノードに変換する。
 * remarkAmazonとremarkRakutenよりも前に実行される必要がある。
 *
 * @features
 * 1. 同一段落内の2つのリンクをチェック（半角スペースまたは改行1つで区切られたURL）
 * 2. 連続する2つの段落をチェック（改行2つで区切られたURL）
 * 3. Amazon URL + 楽天URL（順不同）を検出
 * 4. 統合ProductCardノードに変換
 * 5. 単独URLの場合は何もせず、後続のプラグインに処理を任せる
 *
 * @example
 * // パターン1: 改行2つ（既存）
 * https://www.amazon.co.jp/dp/B08N5WRWNW
 *
 * https://a.r10.to/hF6JlM
 *
 * @example
 * // パターン2: 半角スペース（新規）
 * https://www.amazon.co.jp/dp/B08N5WRWNW https://a.r10.to/hF6JlM
 *
 * @example
 * // パターン3: 改行1つ（新規）
 * https://www.amazon.co.jp/dp/B08N5WRWNW
 * https://a.r10.to/hF6JlM
 *
 * // すべて以下に変換される
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

				// パターン1: 同一段落内に2つのリンク（半角スペースまたは改行1つで区切られたURL）
				const twoLinks = getTwoLinksFromParagraph(node);
				if (twoLinks) {
					const [url1, url2] = twoLinks;

					// Amazon + 楽天のペアを検出（順不同）
					let amazonUrl: string | undefined;
					let rakutenUrl: string | undefined;

					if (isAmazonUrl(url1) && isRakutenUrl(url2)) {
						amazonUrl = url1;
						rakutenUrl = url2;
					} else if (isRakutenUrl(url1) && isAmazonUrl(url2)) {
						rakutenUrl = url1;
						amazonUrl = url2;
					}

					if (amazonUrl && rakutenUrl) {
						// Amazon情報を抽出
						const amazonAsin = extractAmazonAsin(amazonUrl);
						const amazonDomain = extractAmazonDomain(amazonUrl);

						// 楽天情報を抽出
						const rakutenDomain = extractRakutenDomain(rakutenUrl);

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

						// 早期リターン（次の段落チェックは不要）
						return;
					}
				}

				// パターン2: 連続する2つの段落（改行2つで区切られたURL）
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
