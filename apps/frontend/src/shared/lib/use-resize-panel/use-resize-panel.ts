import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizePanelOptions {
	/** パネルの初期幅（px） */
	defaultWidth: number;
	/** パネルの最小幅（px）。デフォルト: 280 */
	minWidth?: number;
	/** パネルの最大幅（px）。デフォルト: 600 */
	maxWidth?: number;
}

interface UseResizePanelReturn {
	/** 現在のパネル幅（px） */
	width: number;
	/** ドラッグ中かどうか */
	isResizing: boolean;
	/** ウィンドウ幅いっぱいに拡大中かどうか */
	isExpanded: boolean;
	/** ドラッグ開始ハンドラ。リサイズハンドルのonMouseDownに渡す */
	startResize: (e: React.MouseEvent) => void;
	/** パネルをウィンドウ幅に拡大する */
	expand: () => void;
	/** パネルをdefaultWidthに戻す */
	collapse: () => void;
	/** 幅に応じた動的カーソルクラス */
	cursorStyle: string;
}

/**
 * パネルの横幅をドラッグでリサイズするためのフック
 *
 * @description
 * requestAnimationFrameベースの60fpsスムーズリサイズを実装する。
 * パネルは画面右端に配置される前提で、マウスを左に動かすと幅が増える。
 *
 * 1. mousedownでドラッグ開始位置と初期幅を記録
 * 2. mousemoveでrAFを使って幅を更新（min/max制約付き）
 * 3. mouseupでクリーンアップ（rAFキャンセル、userSelect復元）
 */
export function useResizePanel({
	defaultWidth,
	minWidth = 280,
	maxWidth = 600,
}: UseResizePanelOptions): UseResizePanelReturn {
	const [width, setWidth] = useState(defaultWidth);
	const [isResizing, setIsResizing] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	const rafIdRef = useRef<number | null>(null);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);

	/** ドラッグ中の幅更新を行うcleanup関数を保持 */
	const cleanupRef = useRef<(() => void) | null>(null);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
			}

			rafIdRef.current = requestAnimationFrame(() => {
				// パネルは右端にあるため、マウスが左に動くと幅が増える
				const delta = startXRef.current - e.clientX;
				const newWidth = Math.min(
					maxWidth,
					Math.max(minWidth, startWidthRef.current + delta)
				);
				setWidth(newWidth);
				rafIdRef.current = null;
			});
		},
		[minWidth, maxWidth]
	);

	const handleMouseUp = useCallback(() => {
		setIsResizing(false);
		document.body.style.userSelect = "";

		if (rafIdRef.current !== null) {
			cancelAnimationFrame(rafIdRef.current);
			rafIdRef.current = null;
		}

		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
		cleanupRef.current = null;
	}, [handleMouseMove]);

	const startResize = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			startXRef.current = e.clientX;
			startWidthRef.current = width;
			setIsResizing(true);
			document.body.style.userSelect = "none";

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);

			cleanupRef.current = () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};
		},
		[width, handleMouseMove, handleMouseUp]
	);

	// アンマウント時のクリーンアップ
	useEffect(() => {
		return () => {
			cleanupRef.current?.();
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
			}
		};
	}, []);

	/** パネルをウィンドウ幅いっぱいに拡大する */
	const expand = useCallback(() => {
		setWidth(window.innerWidth);
		setIsExpanded(true);
	}, []);

	/** パネルをdefaultWidthに戻す */
	const collapse = useCallback(() => {
		setWidth(defaultWidth);
		setIsExpanded(false);
	}, [defaultWidth]);

	/** 幅に応じた動的カーソルクラス */
	const cursorStyle =
		width <= minWidth
			? "cursor-w-resize"
			: width >= maxWidth
				? "cursor-e-resize"
				: "cursor-ew-resize";

	return {
		width,
		isResizing,
		isExpanded,
		startResize,
		expand,
		collapse,
		cursorStyle,
	};
}
