"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseUnsavedChangesAlertOptions {
	/** フォームが変更されているかどうか */
	isDirty: boolean;
	/** アラート機能を有効にするか（保存成功後の一時無効化に使用） */
	enabled?: boolean;
	/** 内部リンクインターセプト時のナビゲーション関数（デフォルト: window.location.href 代入） */
	onNavigate?: (href: string) => void;
}

interface UseUnsavedChangesAlertReturn {
	/** ダイアログの表示状態 */
	showDialog: boolean;
	/** ダイアログでキャンセルを押したときのハンドラー */
	handleCancel: () => void;
	/** ダイアログで変更を破棄を押したときのハンドラー */
	handleConfirm: () => void;
	/** ナビゲーションをガードする関数。dirty状態なら確認ダイアログを表示する */
	guardNavigation: (navigateFn: () => void) => void;
}

/**
 * 未保存の変更がある状態でのページ離脱を防止するフック
 *
 * @description
 * 1. `isDirty && enabled` のとき `beforeunload` イベントを登録（リロード・タブ閉じ対応）
 *    - ブラウザのセキュリティ制約により、カスタムダイアログは表示できない
 *    - `event.preventDefault()` でブラウザネイティブの確認ダイアログのみ表示可能
 * 2. `isDirty && enabled` のとき `popstate` イベントを監視（ブラウザ戻るボタン対応）
 *    - ダミーのhistoryエントリを追加し、戻るボタン押下時にURLを復元してカスタムダイアログ表示
 *    - 「変更を破棄」→ history.go(-2) で実際に戻る（復元用pushState分 + 元のエントリ分）、「キャンセル」→ そのまま留まる
 * 3. `isDirty && enabled` のとき document の click イベントをキャプチャフェーズで監視（Next.js Link 対応）
 *    - Next.js の `<Link>` によるクライアントサイドナビゲーションは beforeunload/popstate が発火しない
 *    - クリック対象が同一オリジンの内部リンクかつ異なるURLの場合、preventDefault でナビゲーションを阻止
 *    - target="_blank" や外部リンク、同じURLへのリンクはスキップ
 * 4. `guardNavigation(fn)` で dirty なら fn を保留してカスタムダイアログ表示、dirty でなければ即実行
 * 5. `handleConfirm` で保留中の fn を実行、`handleCancel` で保留をクリア
 */
export function useUnsavedChangesAlert({
	isDirty,
	enabled = true,
	onNavigate,
}: UseUnsavedChangesAlertOptions): UseUnsavedChangesAlertReturn {
	const [showDialog, setShowDialog] = useState(false);
	const pendingNavigationRef = useRef<(() => void) | null>(null);
	/** handleConfirm 時にリスナーを解除するため、ハンドラの参照を保持する */
	const beforeUnloadHandlerRef = useRef<
		((e: BeforeUnloadEvent) => void) | null
	>(null);
	const popStateHandlerRef = useRef<(() => void) | null>(null);
	/** useEffect の依存配列に入れず再実行を防ぐため、ref で保持する */
	const onNavigateRef = useRef(onNavigate);
	onNavigateRef.current = onNavigate;

	const isActive = isDirty && enabled;

	// 1. beforeunload イベントの登録・解除（リロード・タブ閉じ対応）
	// ブラウザのセキュリティ制約により、beforeunload ではカスタムダイアログを表示できない。
	// event.preventDefault() でブラウザネイティブの確認ダイアログのみ表示される。
	useEffect(() => {
		if (!isActive) {
			return;
		}

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		beforeUnloadHandlerRef.current = handleBeforeUnload;

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			beforeUnloadHandlerRef.current = null;
		};
	}, [isActive]);

	// 2. popstate イベントの監視（ブラウザ戻るボタン対応）
	// Next.js App Routerではブラウザバックがクライアントサイドナビゲーションとして処理されるため、
	// beforeunload は発火しない。popstate を監視してカスタムダイアログを表示する。
	useEffect(() => {
		if (!isActive) {
			return;
		}

		// ダミーのhistoryエントリを追加（戻るボタンを検知するため）
		window.history.pushState(null, "", window.location.href);

		const handlePopState = () => {
			// 現在のURLを復元してページ遷移を阻止
			window.history.pushState(null, "", window.location.href);
			// pushState で復元した分（-1）+ 実際の前のページへの遷移（-1）= -2
			pendingNavigationRef.current = () => {
				window.history.go(-2);
			};
			setShowDialog(true);
		};
		popStateHandlerRef.current = handlePopState;

		window.addEventListener("popstate", handlePopState);
		return () => {
			window.removeEventListener("popstate", handlePopState);
			popStateHandlerRef.current = null;
		};
	}, [isActive]);

	// 3. click イベントのインターセプト（Next.js Link 対応）
	// Next.js の <Link> コンポーネントはクライアントサイドナビゲーションを行うため、
	// beforeunload も popstate も発火しない。document の click イベントを
	// キャプチャフェーズで監視し、内部リンクへのナビゲーションを阻止する。
	useEffect(() => {
		if (!isActive) {
			return;
		}

		const handleClick = (event: MouseEvent) => {
			const target = (event.target as HTMLElement).closest("a");
			if (!target) {
				return;
			}

			const href = target.getAttribute("href");
			if (!href) {
				return;
			}

			// target="_blank" は新しいタブで開くためスキップ
			if (target.target === "_blank") {
				return;
			}

			// 別オリジンのリンクはスキップ（beforeunload で対応される）
			try {
				const url = new URL(href, window.location.origin);
				if (url.origin !== window.location.origin) {
					return;
				}

				// 現在のページと同じURLへのリンクはスキップ
				if (url.href === window.location.href) {
					return;
				}

				// 内部リンクへのナビゲーションを阻止
				event.preventDefault();
				event.stopPropagation();

				const targetHref = url.href;
				pendingNavigationRef.current = () => {
					if (onNavigateRef.current) {
						onNavigateRef.current(targetHref);
					} else {
						window.location.href = targetHref;
					}
				};
				setShowDialog(true);
			} catch {
				// 不正なURLの場合はスキップ
				return;
			}
		};

		document.addEventListener("click", handleClick, true);
		return () => {
			document.removeEventListener("click", handleClick, true);
		};
	}, [isActive]);

	// 4. ナビゲーションをガードする関数（キャンセルボタン対応）
	const guardNavigation = useCallback(
		(navigateFn: () => void) => {
			if (!navigateFn) {
				return;
			}

			if (!isActive) {
				navigateFn();
				return;
			}

			pendingNavigationRef.current = navigateFn;
			setShowDialog(true);
		},
		[isActive]
	);

	// 5. ダイアログで離脱を確認したときのハンドラー
	// pendingFn の実行前に beforeunload / popstate リスナーを解除する。
	// 解除しないと pendingFn 内の window.location.href で beforeunload が再発火し
	// ナビゲーションがブロックされる。また history.go(-2) で popstate が再発火し
	// ダイアログが無限に再表示される。
	const handleConfirm = useCallback(() => {
		// ナビゲーション実行前にリスナーを解除
		if (beforeUnloadHandlerRef.current) {
			window.removeEventListener(
				"beforeunload",
				beforeUnloadHandlerRef.current
			);
			beforeUnloadHandlerRef.current = null;
		}
		if (popStateHandlerRef.current) {
			window.removeEventListener("popstate", popStateHandlerRef.current);
			popStateHandlerRef.current = null;
		}

		const pendingFn = pendingNavigationRef.current;
		pendingNavigationRef.current = null;
		setShowDialog(false);

		if (pendingFn) {
			pendingFn();
		}
	}, []);

	// 6. ダイアログでキャンセルしたときのハンドラー
	// pendingNavigationRef のクリアは handleConfirm のみが行う。
	// Radix AlertDialogAction クリック時に onOpenChange 経由で handleCancel が
	// handleConfirm より先に呼ばれた場合、ここでクリアするとナビゲーション関数を失う。
	const handleCancel = useCallback(() => {
		setShowDialog(false);
	}, []);

	return {
		showDialog,
		handleCancel,
		handleConfirm,
		guardNavigation,
	};
}
