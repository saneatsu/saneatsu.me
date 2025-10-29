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

interface YouTubeNode extends Node {
	type: "youtube";
	data: {
		hName: "youtube";
		hProperties: {
			videoId: string;
			startTime?: number;
		};
	};
}

interface ParentNode extends Node {
	children: Node[];
}

/**
 * YouTube URLからビデオIDを抽出する
 *
 * @description
 * 様々な形式のYouTube URLからビデオIDを抽出する。
 * 対応する形式：
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 *
 * @param url - YouTube URL
 * @returns ビデオID、またはnull
 */
export function extractYouTubeVideoId(url: string): string | null {
	// youtube.com/watch?v=VIDEO_ID
	const watchMatch = url.match(
		/(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/
	);
	if (watchMatch) return watchMatch[1];

	// youtu.be/VIDEO_ID
	const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
	if (shortMatch) return shortMatch[1];

	// youtube.com/embed/VIDEO_ID
	const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
	if (embedMatch) return embedMatch[1];

	// youtube.com/v/VIDEO_ID
	const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
	if (vMatch) return vMatch[1];

	return null;
}

/**
 * YouTube URLからタイムスタンプ（開始時刻）を抽出する
 *
 * @description
 * YouTube URLに含まれるタイムスタンプパラメータを抽出して秒数に変換する。
 * 対応する形式：
 * - &t=123s
 * - &t=123
 * - ?t=123
 * - #t=123
 * - &start=123
 *
 * @param url - YouTube URL
 * @returns 開始時刻（秒）、またはundefined
 */
export function extractYouTubeTimestamp(url: string): number | undefined {
	// t=123s または t=123 形式
	const tMatch = url.match(/[?&#]t=(\d+)s?/);
	if (tMatch) return Number.parseInt(tMatch[1], 10);

	// start=123 形式
	const startMatch = url.match(/[?&]start=(\d+)/);
	if (startMatch) return Number.parseInt(startMatch[1], 10);

	return undefined;
}

/**
 * remark用のYouTube埋め込みプラグイン
 *
 * @description
 * YouTube URLを検出して、カスタムのyoutubeノードに変換する。
 * 以下の形式のURLに対応：
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - タイムスタンプ付きURL（&t=123s、?t=123、#t=123など）
 *
 * @features
 * 1. 段落内の単独のYouTubeリンクをYouTube埋め込みに変換
 * 2. ビデオIDとタイムスタンプを抽出してdata属性に保存
 * 3. 他のテキストと混在している場合は通常のリンクとして扱う
 *
 * @example
 * // マークダウン
 * https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *
 * // 変換後
 * <youtube videoId="dQw4w9WgXcQ" />
 *
 * @example
 * // マークダウン（タイムスタンプ付き）
 * https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=123s
 *
 * // 変換後
 * <youtube videoId="dQw4w9WgXcQ" startTime={123} />
 */
export const remarkYoutube: Plugin = () => {
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

				// YouTube URLを検出
				const youtubeRegex =
					/^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//;
				if (!youtubeRegex.test(url)) return;

				// ビデオIDを抽出
				const videoId = extractYouTubeVideoId(url);
				if (!videoId) return;

				// タイムスタンプを抽出
				const startTime = extractYouTubeTimestamp(url);

				// youtubeノードに変換
				const youtubeNode: YouTubeNode = {
					type: "youtube",
					data: {
						hName: "youtube",
						hProperties: {
							videoId,
							...(startTime !== undefined && { startTime }),
						},
					},
				};

				// 親ノードの子要素を置き換え
				(parent as ParentNode).children[index] = youtubeNode;
			}
		);
	};
};
