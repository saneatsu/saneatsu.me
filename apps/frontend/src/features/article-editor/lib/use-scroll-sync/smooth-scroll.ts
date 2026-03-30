/**
 * スムーズスクロールの閾値（px）
 *
 * @description
 * この閾値以下の差分は即座に目標位置に移動する（通常テキストのスクロール）。
 * 閾値を超える差分はlerp（線形補間）でスムージングされる（画像セグメント等）。
 *
 * 画像セグメントではエディタ1pxに対してプレビューが6〜7px動くため、
 * マウスホイールの1ティック（40〜100px）で267〜670pxのジャンプが発生する。
 * この閾値でスムージングを適用し、複数フレームに分散させる。
 */
const SMOOTHING_THRESHOLD = 200;

/**
 * スムージングの補間係数（0〜1）
 *
 * @description
 * 各フレームで残りの差分のうちこの割合だけ移動する。
 * 0.15 = 15%ずつ移動 → 約20フレーム（≒333ms@60fps）で収束。
 */
const LERP_FACTOR = 0.15;

/**
 * スナップ閾値（px）
 *
 * @description
 * 現在位置と目標位置の差がこの値未満なら目標位置にスナップする。
 * lerp の収束尾を切り捨てて無限に近づき続けるのを防ぐ。
 */
const SNAP_THRESHOLD = 1;

/**
 * 現在のスクロール位置から目標位置へのスムーズなスクロール位置を計算する
 *
 * @description
 * 差分が小さい場合（通常テキストのスクロール）は即座に目標位置を返す。
 * 差分が大きい場合（画像セグメント等）はlerp（線形補間）で段階的に移動する。
 * これにより、画像セグメントでのプレビューの急激なジャンプを防ぎ、
 * 滑らかなスクロール体験を実現する。
 *
 * @param currentScrollTop - プレビューの現在のscrollTop
 * @param targetScrollTop - 補間計算で得られた目標scrollTop
 * @returns 次フレームで設定すべきscrollTop
 */
export function computeSmoothScrollTop(
	currentScrollTop: number,
	targetScrollTop: number
): number {
	const diff = targetScrollTop - currentScrollTop;
	const absDiff = Math.abs(diff);

	// 差がごくわずかなら目標にスナップ
	if (absDiff < SNAP_THRESHOLD) {
		return targetScrollTop;
	}

	// 閾値以下の差分は即座に移動（通常テキストスクロール）
	if (absDiff <= SMOOTHING_THRESHOLD) {
		return targetScrollTop;
	}

	// 閾値超の差分はlerpでスムージング
	return currentScrollTop + diff * LERP_FACTOR;
}
