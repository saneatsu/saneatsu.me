"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseUnsavedChangesAlertOptions {
	/** フォームが変更されているかどうか */
	isDirty: boolean;
	/** アラート機能を有効にするか（保存成功後の一時無効化に使用） */
	enabled?: boolean;
}

interface UseUnsavedChangesAlertReturn {
	/** ダイアログの表示状態 */
	showDialog: boolean;
	/** ダイアログでキャンセルを押したときのハンドラー */
	handleCancel: () => void;
	/** ダイアログで離脱を押したときのハンドラー */
	handleConfirm: () => void;
	/** ナビゲーションをガードする関数。dirty状態なら確認ダイアログを表示する */
	guardNavigation: (navigateFn: () => void) => void;
}

/**
 * 未保存の変更がある状態でのページ離脱を防止するフック
 *
 * @description
 * 1. `isDirty && enabled` のとき `beforeunload` イベントを登録（リロード・タブ閉じ対応）
 * 2. `isDirty && enabled` のとき `popstate` イベントを監視（ブラウザ戻るボタン対応）
 *    - ダミーのhistoryエントリを追加し、戻るボタン押下時にURLを復元してダイアログ表示
 *    - 「離脱する」→ history.go(-1) で実際に戻る、「キャンセル」→ そのまま留まる
 * 3. `guardNavigation(fn)` で dirty なら fn を保留してダイアログ表示、dirty でなければ即実行
 * 4. `handleConfirm` で保留中の fn を実行、`handleCancel` で保留をクリア
 */
export function useUnsavedChangesAlert({
	isDirty,
	enabled = true,
}: UseUnsavedChangesAlertOptions): UseUnsavedChangesAlertReturn {
	const [showDialog, setShowDialog] = useState(false);
	const pendingNavigationRef = useRef<(() => void) | null>(null);

	const isActive = isDirty && enabled;

	// 1. beforeunload イベントの登録・解除
	useEffect(() => {
		if (!isActive) {
			return;
		}

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
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
			// 確認後に history.go(-1) を実行するようセット
			pendingNavigationRef.current = () => {
				window.history.go(-1);
			};
			setShowDialog(true);
		};

		window.addEventListener("popstate", handlePopState);
		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [isActive]);

	// 3. ナビゲーションをガードする関数（キャンセルボタン対応）
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

	// 3. ダイアログで離脱を確認したときのハンドラー
	const handleConfirm = useCallback(() => {
		const pendingFn = pendingNavigationRef.current;
		pendingNavigationRef.current = null;
		setShowDialog(false);

		if (pendingFn) {
			pendingFn();
		}
	}, []);

	// 4. ダイアログでキャンセルしたときのハンドラー
	const handleCancel = useCallback(() => {
		pendingNavigationRef.current = null;
		setShowDialog(false);
	}, []);

	return {
		showDialog,
		handleCancel,
		handleConfirm,
		guardNavigation,
	};
}
