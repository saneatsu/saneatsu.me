import { useCallback, useEffect, useRef } from "react";

import type { ImageUploadResult } from "../use-image-upload/use-image-upload";

/**
 * ペースト画像アップロードフック
 *
 * @description
 * クリップボードから画像を検出して自動的にアップロードし、Markdown形式でエディタに挿入する。
 *
 * 機能：
 * 1. ペーストイベントを監視
 * 2. クリップボードに画像が含まれているか確認
 * 3. 画像があれば自動的にアップロード
 * 4. Markdown形式でエディタに挿入
 * 5. 画像以外のペーストは通常処理
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
 * usePasteImage(editorRef, uploadImage, onChange);
 *
 * <div ref={editorRef}>
 *   <MDEditor ... />
 * </div>
 * ```
 */
export function usePasteImage(
	editorRef: React.RefObject<HTMLDivElement>,
	uploadImage: (file: File) => Promise<ImageUploadResult | null>,
	onChange: (value: string) => void
) {
	const uploadingRef = useRef(false);

	const handlePaste = useCallback(
		async (e: ClipboardEvent) => {
			// アップロード中の場合はスキップ
			if (uploadingRef.current) return;

			const items = e.clipboardData?.items;
			if (!items) return;

			// クリップボードから画像を検索
			for (const item of Array.from(items)) {
				if (item.type.startsWith("image/")) {
					// 画像が見つかった場合、デフォルトのペースト動作をキャンセル
					e.preventDefault();

					const file = item.getAsFile();
					if (!file) continue;

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

							// カーソル位置を取得
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

		// textareaを取得してイベントリスナーを追加
		const textarea = editor.querySelector("textarea");
		if (!textarea) return;

		textarea.addEventListener("paste", handlePaste);

		return () => {
			textarea.removeEventListener("paste", handlePaste);
		};
	}, [editorRef, handlePaste]);
}
