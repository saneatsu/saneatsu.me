import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Nodeの型定義を拡張
 */
interface ParentNode extends Node {
	children: Node[];
}

interface TextNode extends Node {
	type: "text";
	value: string;
}

interface AlertNode extends Node {
	type: "alert";
	data: {
		hName: "alert";
		hProperties: {
			variant: "default" | "info" | "success" | "warning" | "destructive";
			title?: string;
		};
	};
	children: Node[];
}

/**
 * Alertの種類を定義
 */
type AlertType = "NOTE" | "INFO" | "SUCCESS" | "WARNING" | "DANGER";

/**
 * Alertタイプをvariantにマッピングする
 *
 * @param type - Alertタイプ（NOTE, INFO, SUCCESS, WARNING, DANGER）
 * @returns 対応するvariant
 */
function alertTypeToVariant(
	type: AlertType
): "default" | "info" | "success" | "warning" | "destructive" {
	switch (type) {
		case "NOTE":
			return "default";
		case "INFO":
			return "info";
		case "SUCCESS":
			return "success";
		case "WARNING":
			return "warning";
		case "DANGER":
			return "destructive";
	}
}

/**
 * 段落の最初のテキストノードからAlertタイプを抽出する
 *
 * @description
 * GitHub互換のAlert構文 [!TYPE] を検出する。
 * 対応する形式：
 * - [!NOTE]
 * - [!INFO]
 * - [!SUCCESS]
 * - [!WARNING]
 * - [!DANGER]
 *
 * @param node - チェック対象の段落ノード
 * @returns [AlertType, 残りのテキスト] または null
 *
 * @example
 * // "[!NOTE] タイトル" → ["NOTE", " タイトル"]
 * // "[!INFO]" → ["INFO", ""]
 * // "通常のテキスト" → null
 */
function extractAlertType(node: Node): [AlertType, string] | null {
	const paragraphNode = node as ParentNode;

	// 段落の最初の子要素をチェック
	if (paragraphNode.children.length === 0) return null;

	let firstChild = paragraphNode.children[0];

	// remarkBreaks互換性: breakノードをスキップ
	let childIndex = 0;
	while (
		firstChild?.type === "break" &&
		childIndex < paragraphNode.children.length - 1
	) {
		childIndex++;
		firstChild = paragraphNode.children[childIndex];
	}

	if (!firstChild || firstChild.type !== "text") return null;

	const textNode = firstChild as TextNode;
	const text = textNode.value;

	// [!TYPE] パターンをチェック（改行を含むテキストにも対応）
	const alertPattern = /^\[!(NOTE|INFO|SUCCESS|WARNING|DANGER)\](.*)/;
	const match = text.match(alertPattern);

	if (!match) return null;

	const type = match[1] as AlertType;
	// match[2]はタイトル + 改行 + 本文の可能性がある
	// 改行の前までをタイトルとして抽出
	const afterPattern = match[2];
	const newlineIndex = afterPattern.indexOf("\n");
	const titleText =
		newlineIndex !== -1
			? afterPattern.substring(0, newlineIndex).trim()
			: afterPattern.trim();

	return [type, titleText];
}

/**
 * remark用のAlert埋め込みプラグイン
 *
 * @description
 * GitHub互換のAlert構文をサポートする。
 * blockquoteの最初の行が [!TYPE] パターンの場合、Alertノードに変換する。
 *
 * @features
 * 1. blockquote構文を検出
 * 2. [!NOTE], [!INFO], [!SUCCESS], [!WARNING], [!DANGER] をサポート
 * 3. タイトル（[!TYPE]の後のテキスト）とコンテンツを分離
 * 4. remarkBreaksプラグインとの互換性
 *
 * @example
 * // マークダウン
 * > [!NOTE]
 * > これは通常のメモなのだ。
 *
 * // 変換後
 * <alert variant="default">
 *   <AlertDescription>これは通常のメモなのだ。</AlertDescription>
 * </alert>
 *
 * @example
 * // マークダウン（タイトル付き）
 * > [!INFO] 重要な情報
 * > 詳細な説明文がここに入るのだ。
 *
 * // 変換後
 * <alert variant="info" title="重要な情報">
 *   <AlertDescription>詳細な説明文がここに入るのだ。</AlertDescription>
 * </alert>
 *
 * @example
 * // マークダウン（複数段落）
 * > [!WARNING] 注意事項
 * > 最初の段落なのだ。
 * >
 * > 2番目の段落なのだ。
 *
 * // 変換後
 * <alert variant="warning" title="注意事項">
 *   <AlertDescription>
 *     最初の段落なのだ。
 *
 *     2番目の段落なのだ。
 *   </AlertDescription>
 * </alert>
 */
export const remarkAlert: Plugin = () => {
	return (tree: Node) => {
		visit(
			tree,
			"blockquote",
			(node: Node, index: number | undefined, parent: Node | undefined) => {
				if (!parent || index === undefined) return;

				const blockquoteNode = node as ParentNode;

				// blockquote内の最初の段落をチェック
				if (blockquoteNode.children.length === 0) return;

				const firstParagraph = blockquoteNode.children[0];
				if (firstParagraph.type !== "paragraph") return;

				// Alertタイプを抽出
				const result = extractAlertType(firstParagraph);
				if (!result) return;

				const [type, title] = result;
				const variant = alertTypeToVariant(type);

				// 最初の段落から[!TYPE]パターン以降のコンテンツを取得
				const firstParagraphNode = firstParagraph as ParentNode;
				const paragraphChildren = [...firstParagraphNode.children];

				// [!TYPE]パターンを含むテキストノードを見つけて、その後のコンテンツを取得
				const firstParagraphContent: Node[] = [];
				let foundAlertPattern = false;
				let skippedFirstBreak = false; // [!TYPE]直後の最初のbreakノードをスキップしたかどうか

				for (let i = 0; i < paragraphChildren.length; i++) {
					const child = paragraphChildren[i];

					if (!foundAlertPattern && child.type === "text") {
						const textNode = child as TextNode;
						// [!TYPE]パターンが含まれているテキストノードを見つける
						const match = /^\[!(NOTE|INFO|SUCCESS|WARNING|DANGER)\](.*)/.exec(
							textNode.value
						);
						if (match) {
							foundAlertPattern = true;
							// match[2]はタイトル + 改行 + 本文の可能性がある
							// タイトル部分は既に extractAlertType で取得済み
							// 改行以降のテキストだけを本文に追加する
							const afterPattern = match[2];

							// 改行がある場合、改行以降を本文に追加
							const newlineIndex = afterPattern.indexOf("\n");
							if (newlineIndex !== -1) {
								const contentAfterNewline = afterPattern.substring(
									newlineIndex + 1
								);
								if (contentAfterNewline.trim()) {
									firstParagraphContent.push({
										type: "text",
										value: contentAfterNewline,
									} as TextNode);
								}
							}
							// タイトルだけの場合（改行がない場合）は何も追加しない
							continue;
						}
					}

					// [!TYPE]パターンの後ろのノードを追加
					// remarkBreaksプラグインとの互換性のため、[!TYPE]直後の最初のbreakノード（<br>）だけスキップする
					// 理由：
					// 1. remarkBreaksは改行を <br> に変換するため、[!TYPE]の直後にbreakノードが挿入される
					// 2. このbreakノードをそのまま追加すると、最初の段落の先頭に <br> が入り、余分な行が表示される
					// 3. 結果として、最初の段落だけ高さが2倍（2行分）になってしまう
					// 4. ただし、それ以降のbreakノードは、テキスト間の改行を表すため保持する必要がある
					// このため、最初のbreakノードだけを明示的にスキップして、それ以降は通常通り追加する
					if (foundAlertPattern) {
						// 最初のbreakノードだけスキップ
						if (child.type === "break" && !skippedFirstBreak) {
							skippedFirstBreak = true;
							continue;
						}
						// それ以降のノード（breakノードを含む）は追加
						firstParagraphContent.push(child);
					}
				}

				// children配列を構築
				const children: Node[] = [];

				// 最初の段落のコンテンツがある場合、段落として追加
				if (firstParagraphContent.length > 0) {
					children.push({
						type: "paragraph",
						children: firstParagraphContent,
					} as ParentNode);
				}

				// 2番目以降の段落を追加
				children.push(...blockquoteNode.children.slice(1));

				// Alertノードを作成
				const alertNode: AlertNode = {
					type: "alert",
					data: {
						hName: "alert",
						hProperties: {
							variant,
							...(title && { title }),
						},
					},
					children,
				};

				// 親ノードの子要素を置き換え
				(parent as ParentNode).children[index] = alertNode;
			}
		);
	};
};
