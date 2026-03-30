/**
 * アンカーマッピングの型定義
 *
 * @description
 * エディタ側のピクセル位置とプレビュー側のピクセル位置の対応。
 */
export interface AnchorMapping {
	/** textarea内のピクセル位置 */
	sourceOffset: number;
	/** プレビューDOM内のピクセル位置 */
	previewOffset: number;
}

/**
 * アンカーマッピングを使った区分線形補間でプレビューのスクロール位置を計算する
 *
 * @description
 * textareaのscrollTopから、プレビューに設定すべきscrollTopを計算する。
 * アンカーポイント間を線形補間し、プレビュー内の対応する位置を算出する。
 *
 * 処理の流れ：
 * 1. マッピングが空の場合は単純比例にフォールバック
 * 2. エディタが一番下までスクロールしている場合はプレビューも一番下にスナップ
 * 3. scrollTopが最初のアンカーより前 → 0〜最初のアンカー間で比例
 * 4. scrollTopが最後のアンカーより後 → 最後のアンカー〜末尾間で比例
 * 5. 2つのアンカー間にある場合 → 線形補間
 *
 * @param scrollTop - textareaの現在のscrollTop
 * @param mappings - ソート済みのアンカーマッピング配列
 * @param editorScrollableHeight - エディタのスクロール可能な高さ（scrollHeight - offsetHeight）
 * @param previewScrollableHeight - プレビューのスクロール可能な高さ（scrollHeight - offsetHeight）
 * @returns プレビューに設定すべきscrollTop
 */
export function interpolateScrollPosition(
	scrollTop: number,
	mappings: AnchorMapping[],
	editorScrollableHeight: number,
	previewScrollableHeight: number
): number {
	// 1. スクロール不要な場合
	if (editorScrollableHeight <= 0 || previewScrollableHeight <= 0) {
		return 0;
	}

	// 2. マッピングが空 → 単純比例にフォールバック
	if (mappings.length === 0) {
		return (scrollTop / editorScrollableHeight) * previewScrollableHeight;
	}

	// 3. エディタが一番下 → プレビューも一番下
	if (scrollTop >= editorScrollableHeight) {
		return previewScrollableHeight;
	}

	// 4. scrollTopが最初のアンカーより前
	const first = mappings[0];
	if (scrollTop <= first.sourceOffset) {
		if (first.sourceOffset <= 0) {
			return first.previewOffset;
		}
		const t = scrollTop / first.sourceOffset;
		return t * first.previewOffset;
	}

	// 5. scrollTopが最後のアンカーより後
	const last = mappings[mappings.length - 1];
	if (scrollTop >= last.sourceOffset) {
		const remainingSource = editorScrollableHeight - last.sourceOffset;
		const remainingPreview = previewScrollableHeight - last.previewOffset;
		if (remainingSource <= 0) {
			return last.previewOffset;
		}
		const t = (scrollTop - last.sourceOffset) / remainingSource;
		return Math.min(
			last.previewOffset + t * remainingPreview,
			previewScrollableHeight
		);
	}

	// 6. 2つのアンカー間で線形補間（二分探索で前後のアンカーを見つける）
	let lo = 0;
	let hi = mappings.length - 1;

	while (lo < hi - 1) {
		const mid = Math.floor((lo + hi) / 2);
		if (mappings[mid].sourceOffset <= scrollTop) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	const prev = mappings[lo];
	const next = mappings[hi];
	const sourceRange = next.sourceOffset - prev.sourceOffset;

	if (sourceRange <= 0) {
		return prev.previewOffset;
	}

	const t = (scrollTop - prev.sourceOffset) / sourceRange;
	return prev.previewOffset + t * (next.previewOffset - prev.previewOffset);
}
