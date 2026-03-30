import type { AnchorPoint } from "./extract-anchor-points";
import type { AnchorMapping } from "./interpolate-scroll";

/**
 * textareaのword-wrapを考慮した各行の実際のビジュアルY位置を計測する
 *
 * @description
 * textareaと同じスタイルのミラー要素を作成し、テキスト全体を単一のテキストノードとして
 * 挿入した上で、Range APIのcollapsed Rangeを使って各行の先頭位置を計測する。
 *
 * 空の`<span>`マーカーでは `pre-wrap` コンテキストで `width: 0, height: 0` となり
 * 正確な座標を返さないため、collapsed Rangeによるキャレット位置計測を使用する。
 * これにより、長い画像URLなどが折り返される場合でも正確な位置が得られる。
 *
 * ミラー要素の幅はtextareaのスクロールバーを除いた実テキスト領域幅に合わせる。
 * `getComputedStyle().width` にはスクロールバー幅が含まれるため、
 * そのまま使うとミラーが実際より広くなり、折り返しが少なくなることで
 * sourceOffsetが過小評価される。`offsetWidth - clientWidth` でスクロールバー幅を算出し、
 * CSS幅から差し引くことで正確な幅にする。
 *
 * `sourceLine * lineHeight` では折り返しを考慮できないため、
 * この関数で実際のレイアウト後の位置を取得する。
 */
function measureSourceLineOffsets(
	textarea: HTMLTextAreaElement,
	targetLines: Set<number>
): Map<number, number> {
	if (targetLines.size === 0) return new Map();

	const style = getComputedStyle(textarea);
	const mirror = document.createElement("div");

	// textareaと同じレイアウトを再現するスタイルをコピー
	mirror.style.position = "absolute";
	mirror.style.top = "0";
	mirror.style.left = "-9999px";
	mirror.style.visibility = "hidden";
	mirror.style.height = "auto";
	mirror.style.overflow = "hidden";

	// スクロールバー幅を差し引いてtextareaの実テキスト領域幅に合わせる
	// offsetWidthはborder+padding+content+scrollbar、clientWidthはpadding+content
	// 差分がスクロールバー幅（+ border）なので、CSS幅からborderを除いた分を引く
	const scrollbarWidth = textarea.offsetWidth - textarea.clientWidth;
	const cssWidth = Number.parseFloat(style.width);
	const adjustedWidth = cssWidth - scrollbarWidth;
	mirror.style.width = `${adjustedWidth}px`;

	mirror.style.font = style.font;
	mirror.style.letterSpacing = style.letterSpacing;
	mirror.style.whiteSpace = "pre-wrap";
	mirror.style.wordWrap = "break-word";
	mirror.style.overflowWrap = "break-word";
	mirror.style.padding = style.padding;
	mirror.style.border = style.border;
	mirror.style.boxSizing = style.boxSizing;
	mirror.style.tabSize = style.tabSize;
	mirror.style.lineHeight = style.lineHeight;

	// 単一テキストノードとして挿入（Range APIで正確に位置計測するため）
	const fullText = textarea.value;
	const textNode = document.createTextNode(fullText);
	mirror.appendChild(textNode);
	document.body.appendChild(mirror);

	// 各行の開始文字オフセットを事前計算
	const lines = fullText.split("\n");
	const lineStartOffsets: number[] = [];
	let charOffset = 0;
	for (let i = 0; i < lines.length; i++) {
		lineStartOffsets.push(charOffset);
		charOffset += lines[i].length + 1;
	}

	// Range APIで各ターゲット行のY位置を計測
	const mirrorRect = mirror.getBoundingClientRect();
	const result = new Map<number, number>();
	const range = document.createRange();

	for (const lineNum of targetLines) {
		if (lineNum < 0 || lineNum >= lines.length) continue;
		const offset = Math.min(lineStartOffsets[lineNum], textNode.length);
		range.setStart(textNode, offset);
		range.setEnd(textNode, offset);
		const rangeRect = range.getBoundingClientRect();
		result.set(lineNum, rangeRect.top - mirrorRect.top);
	}

	document.body.removeChild(mirror);
	return result;
}

/**
 * プレビューDOMからアンカーマッピングテーブルを構築する
 *
 * @description
 * 各アンカーポイントに対応するプレビューDOM要素を検索し、
 * エディタ側の位置（ミラー要素で計測したビジュアル位置）とプレビュー側の位置（offsetTop）の
 * マッピングテーブルを構築する。
 *
 * 処理の流れ：
 * 1. ミラー要素を使って各アンカー行のビジュアルY位置を計測（word-wrap対応）
 * 2. 各アンカーポイントに対応するプレビューDOM要素を検索
 *    - heading: CSS.escapeで見出しIDから検索
 *    - image: img要素の出現順インデックスで対応
 *    - codeblock: pre要素の出現順インデックスで対応
 *    - hr: hr要素の出現順インデックスで対応
 *    - embed: 動的インポートのため存在しない場合はスキップ
 * 3. DOM要素のoffsetTopをプレビューコンテナからの相対位置として計算
 *
 * @param anchorPoints - extractAnchorPointsから取得したアンカーポイント配列
 * @param textarea - エディタのtextarea要素
 * @param previewContainer - プレビューのコンテナDiv要素
 * @returns アンカーマッピングの配列（sourceOffset昇順）
 */
export function buildAnchorMappings(
	anchorPoints: AnchorPoint[],
	textarea: HTMLTextAreaElement,
	previewContainer: HTMLDivElement
): AnchorMapping[] {
	// word-wrapを考慮した各行の実際のビジュアル位置を計測
	const targetLines = new Set(anchorPoints.map((a) => a.sourceLine));
	const lineOffsets = measureSourceLineOffsets(textarea, targetLines);

	// 各タイプの出現カウンター（出現順インデックスで対応付けるため）
	let imageIndex = 0;
	let codeblockIndex = 0;
	let hrIndex = 0;
	let embedIndex = 0;

	// プレビュー内のDOM要素リストを事前取得
	// カード内の画像（.not-prose内のimg）を除外し、Markdownのスタンドアロン画像のみ対象
	const images = Array.from(previewContainer.querySelectorAll("img")).filter(
		(img) => !img.closest(".not-prose")
	);
	const preElements = previewContainer.querySelectorAll("pre");
	const hrElements = previewContainer.querySelectorAll("hr");
	// URLカード・Amazon商品カード・楽天カードはすべて a.not-prose クラスを共有
	const embedElements = previewContainer.querySelectorAll("a.not-prose");

	const mappings: AnchorMapping[] = [];

	for (const anchor of anchorPoints) {
		const sourceOffset = lineOffsets.get(anchor.sourceLine) ?? 0;
		let previewElement: Element | null = null;

		switch (anchor.type) {
			case "heading": {
				if (anchor.headingId) {
					// CSS.escapeで安全にIDを検索（日本語対応）
					previewElement = previewContainer.querySelector(
						`#${CSS.escape(anchor.headingId)}`
					);
				}
				break;
			}
			case "image": {
				previewElement = images[imageIndex] ?? null;
				imageIndex++;
				break;
			}
			case "codeblock": {
				previewElement = preElements[codeblockIndex] ?? null;
				codeblockIndex++;
				// コードブロックはエディタ側でも複数行を占めるため、1行ジャンプの問題は起きにくい
				break;
			}
			case "hr": {
				previewElement = hrElements[hrIndex] ?? null;
				hrIndex++;
				break;
			}
			case "embed": {
				previewElement = embedElements[embedIndex] ?? null;
				embedIndex++;
				break;
			}
		}

		if (previewElement && previewElement instanceof HTMLElement) {
			// プレビューコンテナからの相対位置を計算
			const previewOffset =
				previewElement.offsetTop - previewContainer.offsetTop;

			mappings.push({
				sourceOffset,
				previewOffset: Math.max(0, previewOffset),
			});
		}
	}

	return mappings;
}
