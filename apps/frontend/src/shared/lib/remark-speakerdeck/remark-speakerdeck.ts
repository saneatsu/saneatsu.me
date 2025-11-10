import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

interface TextNode extends Node {
	type: "text";
	value: string;
}

interface LinkNode extends Node {
	type: "link";
	url: string;
	children: Node[];
}

interface SpeakerDeckNode extends Node {
	type: "speakerdeck";
	data: {
		hName: "speakerdeck";
		hProperties: {
			deckPath: string;
			url: string;
			slide?: number;
		};
	};
}

interface ParentNode extends Node {
	children: Node[];
}

interface SpeakerDeckInfo {
	deckPath: string;
	slide?: number;
}

const SPEAKER_DECK_HOST = "speakerdeck.com";

/**
 * Speaker DeckのURLかどうかを判定
 */
function isSpeakerDeckHost(hostname: string): boolean {
	return (
		hostname === SPEAKER_DECK_HOST || hostname.endsWith(`.${SPEAKER_DECK_HOST}`)
	);
}

/**
 * Speaker Deck URLからデッキ情報を抽出
 *
 * @param url - Speaker DeckのURL
 */
export function extractSpeakerDeckInfo(url: string): SpeakerDeckInfo | null {
	let parsed: URL;

	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	if (!isSpeakerDeckHost(parsed.hostname)) {
		return null;
	}

	const pathSegments = parsed.pathname.split("/").filter(Boolean);

	// /{user}/{deck} のように少なくとも2セグメントが必要
	if (pathSegments.length < 2) {
		return null;
	}

	const deckPath = pathSegments.join("/");

	const querySlide = parsed.searchParams.get("slide") ?? undefined;
	const hashSlide = parsed.hash
		? parsed.hash.match(/slide=(\d+)/)?.[1]
		: undefined;
	const slideString = querySlide ?? hashSlide;
	const slide =
		slideString !== undefined ? Number.parseInt(slideString, 10) : undefined;

	if (slide !== undefined && Number.isNaN(slide)) {
		return { deckPath };
	}

	return slide !== undefined ? { deckPath, slide } : { deckPath };
}

/**
 * リンクテキストがURLそのものかどうか（自動リンク判定）
 */
function isAutoLinkedUrl(linkNode: LinkNode): boolean {
	if (linkNode.children.length !== 1) return false;
	const [child] = linkNode.children;
	if (child.type !== "text") return false;
	return (child as TextNode).value.trim() === linkNode.url;
}

/**
 * remark用のSpeaker Deck埋め込みプラグイン
 *
 * パラグラフ内に自動リンク化されたSpeaker Deck URLが単独で存在する場合、
 * speakerdeckノードへと変換し、MarkdownPreviewでスライド埋め込みを行う。
 */
export const remarkSpeakerdeck: Plugin = () => {
	return (tree: Node) => {
		visit(
			tree,
			"paragraph",
			(node: Node, index: number | undefined, parent: Node | undefined) => {
				if (!parent || index === undefined) return;

				const paragraphNode = node as ParentNode;

				// パラグラフ内の子要素が1つのみ（リンク）であること
				if (paragraphNode.children.length !== 1) return;

				const child = paragraphNode.children[0];
				if (child.type !== "link") return;

				const linkNode = child as LinkNode;

				// 手動でテキストを付けたリンクは通常のリンクとして扱う
				if (!isAutoLinkedUrl(linkNode)) return;

				const info = extractSpeakerDeckInfo(linkNode.url);
				if (!info) return;

				const speakerDeckNode: SpeakerDeckNode = {
					type: "speakerdeck",
					data: {
						hName: "speakerdeck",
						hProperties: {
							url: linkNode.url,
							deckPath: info.deckPath,
							...(info.slide !== undefined && { slide: info.slide }),
						},
					},
				};

				(parent as ParentNode).children[index] = speakerDeckNode;
			}
		);
	};
};
