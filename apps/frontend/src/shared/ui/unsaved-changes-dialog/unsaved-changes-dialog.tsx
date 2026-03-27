"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../alert-dialog/alert-dialog";

interface UnsavedChangesDialogProps {
	/** ダイアログの表示状態 */
	open: boolean;
	/** キャンセルボタンを押したときのハンドラー */
	onCancel: () => void;
	/** 離脱ボタンを押したときのハンドラー */
	onConfirm: () => void;
}

/**
 * 未保存の変更がある状態でのページ離脱確認ダイアログ
 *
 * @description
 * フォームに未保存の変更がある状態でユーザーがページを離脱しようとした際に表示する。
 * キャンセルでフォームに戻り、離脱で変更を破棄してナビゲーションを実行する。
 */
export function UnsavedChangesDialog({
	open,
	onCancel,
	onConfirm,
}: UnsavedChangesDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>変更が保存されていません</AlertDialogTitle>
					<AlertDialogDescription>
						保存されていない変更があります。このページを離れると変更内容は失われます。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>キャンセル</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>離脱する</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
