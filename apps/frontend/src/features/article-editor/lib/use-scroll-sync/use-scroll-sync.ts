import { type RefObject, useEffect, useMemo, useRef } from "react";

import { buildAnchorMappings } from "./build-anchor-mappings";
import { extractAnchorPoints } from "./extract-anchor-points";
import type { AnchorMapping } from "./interpolate-scroll";
import { interpolateScrollPosition } from "./interpolate-scroll";

/**
 * スクロール同期フックの設定
 */
interface UseScrollSyncConfig {
	/** エディタ（textarea）のref */
	textareaRef: RefObject<HTMLTextAreaElement | null>;
	/** プレビューペインのref */
	previewRef: RefObject<HTMLDivElement | null>;
	/** Markdownソーステキスト */
	markdown: string;
}

/**
 * エディタ（textarea）→ プレビューのスクロール同期を行うカスタムフック
 *
 * @description
 * Markdownソースの構造的アンカーポイント（見出し・画像・コードブロック等）を使って、
 * エディタとプレビュー間のスクロール位置を正確に同期する。
 *
 * 処理の流れ：
 * 1. Markdownテキストからアンカーポイントを抽出（useMemo）
 * 2. プレビューDOMのレンダリング後にアンカーマッピングを構築（useEffect + debounce）
 * 3. ResizeObserverでプレビューのサイズ変化を監視し、マッピングを再構築
 * 4. textareaのscrollイベントで区分線形補間によりプレビューのscrollTopを計算・設定
 *
 * @param config - フックの設定
 */
export function useScrollSync({
	textareaRef,
	previewRef,
	markdown,
}: UseScrollSyncConfig): void {
	// 1. アンカーポイントの抽出（markdownが変わったら再計算）
	const anchorPoints = useMemo(() => extractAnchorPoints(markdown), [markdown]);

	// マッピングテーブルのキャッシュ
	const mappingsRef = useRef<AnchorMapping[]>([]);

	// 2. マッピング構築 + ResizeObserver + スクロールイベント
	useEffect(() => {
		const textarea = textareaRef.current;
		const preview = previewRef.current;

		if (!textarea || !preview) return;

		let rafId: number | null = null;
		let debounceTimer: ReturnType<typeof setTimeout> | null = null;

		/**
		 * アンカーマッピングを再構築する
		 */
		const rebuildMappings = () => {
			if (!textarea || !preview) return;
			mappingsRef.current = buildAnchorMappings(
				anchorPoints,
				textarea,
				preview
			);
		};

		/**
		 * デバウンス付きでマッピングを再構築する
		 *
		 * @description
		 * 動的インポートのロード完了やDOM更新を待つために300msのデバウンスを適用
		 */
		const debouncedRebuild = () => {
			if (debounceTimer !== null) {
				clearTimeout(debounceTimer);
			}
			debounceTimer = setTimeout(rebuildMappings, 300);
		};

		/**
		 * textareaのスクロールイベントハンドラ
		 *
		 * @description
		 * requestAnimationFrameで処理を最適化し、
		 * アンカーマッピングを使った区分線形補間でプレビューのスクロール位置を計算する
		 */
		const handleScroll = () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}

			rafId = requestAnimationFrame(() => {
				if (!textarea || !preview) return;

				const editorScrollableHeight =
					textarea.scrollHeight - textarea.offsetHeight;
				const previewScrollableHeight =
					preview.scrollHeight - preview.offsetHeight;

				if (editorScrollableHeight > 0 && previewScrollableHeight > 0) {
					const newScrollTop = interpolateScrollPosition(
						textarea.scrollTop,
						mappingsRef.current,
						editorScrollableHeight,
						previewScrollableHeight
					);

					preview.scrollTop = newScrollTop;
				}
			});
		};

		// 初回マッピング構築（DOMレンダリング完了を待つ）
		const initialTimer = setTimeout(rebuildMappings, 100);

		// プレビューのサイズ変化を監視（動的インポートのロード完了対応）
		const resizeObserver = new ResizeObserver(debouncedRebuild);
		resizeObserver.observe(preview);

		// スクロールイベントのリッスン
		textarea.addEventListener("scroll", handleScroll);

		return () => {
			clearTimeout(initialTimer);
			if (debounceTimer !== null) {
				clearTimeout(debounceTimer);
			}
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
			resizeObserver.disconnect();
			textarea.removeEventListener("scroll", handleScroll);
		};
	}, [anchorPoints, textareaRef, previewRef]);
}
