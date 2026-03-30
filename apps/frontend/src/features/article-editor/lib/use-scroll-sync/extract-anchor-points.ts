import { removeMarkdownLinks, slugify } from "@/shared/lib/extract-headings";

/**
 * アンカーポイントの型定義
 *
 * @description
 * Markdownソース内の構造的に意味のある要素（見出し・画像・コードブロック・埋め込み・水平線）を表す。
 * スクロール同期のためにエディタとプレビュー間の対応点として使用する。
 */
export interface AnchorPoint {
	/** Markdownソースでの行番号（0-based） */
	sourceLine: number;
	/** アンカーの種類 */
	type: "heading" | "image" | "codeblock" | "embed" | "hr";
	/** 見出しの場合のID（DOMでの検索用） */
	headingId?: string;
	/** 見出しの場合のレベル (1-6) */
	headingLevel?: number;
}

/** 見出しを検出する正規表現 */
const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;

/** 行頭の画像を検出する正規表現 */
const IMAGE_REGEX = /^!\[.*\]\(.*\)/;

/** コードブロックフェンスを検出する正規表現 */
const CODEBLOCK_REGEX = /^```/;

/** 水平線を検出する正規表現 */
const HR_REGEX = /^---+$/;

/**
 * 非カード型の埋め込みURL（iframeとしてレンダリングされ、a.not-proseにならない）
 *
 * @description
 * Twitter/X, YouTube, SpeakerDeck, Google Mapsはiframeとして埋め込まれるため、
 * DOMでは`a.not-prose`要素にならない。これらを除外することでembedIndexの不整合を防ぐ。
 */
const NON_CARD_EMBED_REGEX =
	/^https?:\/\/(twitter\.com|x\.com|(?:www\.)?youtube\.com|youtu\.be|(?:.*\.)?speakerdeck\.com|(?:www\.|maps\.)?google\.com\/maps)\//;

/** 画像拡張子パターン（画像URLはimgタグとしてレンダリングされるため除外） */
const IMAGE_URL_EXTENSIONS_REGEX = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;

/**
 * Markdownテキストからアンカーポイントを抽出する純粋関数
 *
 * @description
 * Markdownの構造的要素を走査し、スクロール同期に使用するアンカーポイントを生成する。
 * extractHeadingsと同じパターン（行分割 + コードブロックスキップ）を使用。
 *
 * 処理の流れ：
 * 1. Markdownテキストを行ごとに分割
 * 2. 各行を走査し、コードブロック内かどうかを追跡
 * 3. コードブロック外の行で見出し・画像・埋め込みURL・水平線を検出
 * 4. コードブロックの開始行自体もアンカーポイントとして記録
 *
 * @param markdown - 解析するMarkdownテキスト
 * @returns アンカーポイントの配列（行番号順）
 */
export function extractAnchorPoints(markdown: string): AnchorPoint[] {
	if (!markdown) {
		return [];
	}

	const anchors: AnchorPoint[] = [];
	const lines = markdown.split("\n");
	const seenIds = new Set<string>();
	let isInsideCodeBlock = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trimStart();

		// コードブロックフェンスの検出
		if (CODEBLOCK_REGEX.test(trimmedLine)) {
			if (!isInsideCodeBlock) {
				// コードブロック開始 → アンカーポイントとして記録
				anchors.push({ sourceLine: i, type: "codeblock" });
			}
			isInsideCodeBlock = !isInsideCodeBlock;
			continue;
		}

		// コードブロック内の行はスキップ
		if (isInsideCodeBlock) {
			continue;
		}

		// 見出しの検出
		const headingMatch = line.match(HEADING_REGEX);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const rawText = headingMatch[2].trim();
			const text = removeMarkdownLinks(rawText);

			// extractHeadingsと同じID生成ロジック（重複防止）
			const baseId = slugify(text);
			let id = baseId;
			let counter = 1;

			while (seenIds.has(id)) {
				id = `${baseId}-${counter}`;
				counter++;
			}

			seenIds.add(id);

			anchors.push({
				sourceLine: i,
				type: "heading",
				headingId: id,
				headingLevel: level,
			});
			continue;
		}

		// 行頭の画像の検出（インライン画像は除外）
		if (IMAGE_REGEX.test(trimmedLine) && trimmedLine === line) {
			anchors.push({ sourceLine: i, type: "image" });
			continue;
		}

		// 水平線の検出
		if (HR_REGEX.test(trimmedLine)) {
			anchors.push({ sourceLine: i, type: "hr" });
			continue;
		}

		// 埋め込みURLの検出（行全体がURLのみで、カード型としてレンダリングされるもの）
		const trimmed = line.trim();
		if (
			trimmed.startsWith("http") &&
			!trimmed.includes(" ") &&
			!NON_CARD_EMBED_REGEX.test(trimmed) &&
			!IMAGE_URL_EXTENSIONS_REGEX.test(trimmed)
		) {
			anchors.push({ sourceLine: i, type: "embed" });
		}
	}

	return anchors;
}
