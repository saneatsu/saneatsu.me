import { useCallback, useEffect, useRef } from "react";

import type { ImageUploadResult } from "../use-image-upload/use-image-upload";

/**
 * ドラッグ&ドロップ画像アップロードフック
 *
 * @description
 * ドラッグ&ドロップで画像を検出して自動的にアップロードし、Markdown形式でエディタに挿入する。
 *
 * 機能：
 * 1. ドラッグ&ドロップイベントを監視
 * 2. ドロップされたファイルから画像を検出
 * 3. 画像があれば自動的にアップロード
 * 4. Markdown形式でエディタに挿入
 * 5. 画像以外のドロップは通常処理
 *
 * @param editorRef - MDEditorのrefオブジェクト
 * @param uploadImage - 画像アップロード関数
 * @param onChange - エディタの値変更ハンドラー
 *
 * @example
 * ```tsx
 * const editorRef = useRef<HTMLDivElement>(null);
 * const { uploadImage } = useImageUpload();
 *
 * useDropImage(editorRef, uploadImage, onChange);
 *
 * <div ref={editorRef}>
 *   <MDEditor ... />
 * </div>
 * ```
 */
export function useDropImage(
	editorRef: React.RefObject<HTMLDivElement>,
	uploadImage: (file: File) => Promise<ImageUploadResult | null>,
	onChange: (value: string) => void
) {
	const uploadingRef = useRef(false);

	const handleDragOver = useCallback((e: DragEvent) => {
		// ドラッグオーバー中のデフォルト動作をキャンセル（ドロップを許可）
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		async (e: DragEvent) => {
			// ドロップのデフォルト動作をキャンセル
			e.preventDefault();
			e.stopPropagation();

			// アップロード中の場合はスキップ
			if (uploadingRef.current) return;

			const files = e.dataTransfer?.files;
			if (!files || files.length === 0) return;

			// ドロップされたファイルから画像を検索
			for (const file of Array.from(files)) {
				if (file.type.startsWith("image/")) {
					uploadingRef.current = true;

					try {
						// 画像をアップロード
						const result = await uploadImage(file);
						if (result) {
							// textareaを取得
							const textarea = editorRef.current?.querySelector(
								"textarea"
							) as HTMLTextAreaElement;
							if (!textarea) return;

							// カーソル位置を取得（ドロップ位置ではなく、現在のカーソル位置）
							const cursorPos = textarea.selectionStart;
							const currentValue = textarea.value;

							// カーソル位置にMarkdownを挿入
							const newValue =
								currentValue.substring(0, cursorPos) +
								result.markdown +
								currentValue.substring(cursorPos);

							// エディタの値を更新
							onChange(newValue);

							// カーソル位置を更新（画像Markdownの後ろに移動）
							setTimeout(() => {
								const newCursorPos = cursorPos + result.markdown.length;
								textarea.focus();
								textarea.setSelectionRange(newCursorPos, newCursorPos);
							}, 0);
						}
					} finally {
						uploadingRef.current = false;
					}

					// 最初の画像のみ処理
					break;
				}
			}
		},
		[editorRef, uploadImage, onChange]
	);

	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		// エディタのコンテナにイベントリスナーを追加
		editor.addEventListener("dragover", handleDragOver);
		editor.addEventListener("drop", handleDrop);

		return () => {
			editor.removeEventListener("dragover", handleDragOver);
			editor.removeEventListener("drop", handleDrop);
		};
	}, [editorRef, handleDragOver, handleDrop]);
}
