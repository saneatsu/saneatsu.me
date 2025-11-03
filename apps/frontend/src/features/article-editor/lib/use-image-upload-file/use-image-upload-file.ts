import { useCallback, useRef } from "react";

import type { ImageUploadResult } from "../use-image-upload/use-image-upload";

/**
 * ファイル選択による画像アップロードフック（textarea専用）
 *
 * @description
 * ファイル選択ダイアログを開いて画像を選択し、自動的にアップロードして、
 * Markdown形式でエディタに挿入する。
 *
 * 機能：
 * 1. ファイル選択ダイアログを開く関数を提供
 * 2. 選択されたファイルが画像かどうかを検証
 * 3. ファイルサイズが10MB以下かどうかを検証
 * 4. 画像があれば自動的にアップロード
 * 5. Markdown形式でエディタに挿入
 * 6. 重複アップロード防止
 *
 * @param textareaRef - textareaのrefオブジェクト
 * @param uploadImage - 画像アップロード関数
 * @param onChange - エディタの値変更ハンドラー
 *
 * @returns openFileDialog - ファイル選択ダイアログを開く関数
 *
 * @example
 * ```tsx
 * const textareaRef = useRef<HTMLTextAreaElement>(null);
 * const { uploadImage } = useImageUpload();
 * const { openFileDialog } = useImageUploadFile(textareaRef, uploadImage, onChange);
 *
 * <button onClick={openFileDialog}>画像をアップロード</button>
 * <textarea ref={textareaRef} ... />
 * ```
 */
export function useImageUploadFile(
	textareaRef: React.RefObject<HTMLTextAreaElement>,
	uploadImage: (file: File) => Promise<ImageUploadResult | null>,
	onChange: (value: string) => void
) {
	const uploadingRef = useRef(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleFileSelect = useCallback(
		async (e: Event) => {
			// アップロード中の場合はスキップ
			if (uploadingRef.current) return;

			const input = e.target as HTMLInputElement;
			const files = input.files;

			if (!files || files.length === 0) return;

			const file = files[0];

			// 1. 画像ファイルかどうかを検証
			if (!file.type.startsWith("image/")) {
				return;
			}

			// 2. ファイルサイズが10MB以下かどうかを検証
			const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSizeInBytes) {
				return;
			}

			uploadingRef.current = true;

			try {
				// 3. 画像をアップロード
				const result = await uploadImage(file);
				if (result) {
					const textarea = textareaRef.current;
					if (!textarea) return;

					// 4. カーソル位置を取得
					const cursorPos = textarea.selectionStart;
					const currentValue = textarea.value;

					// 5. カーソル位置にMarkdownを挿入
					const newValue =
						currentValue.substring(0, cursorPos) +
						result.markdown +
						currentValue.substring(cursorPos);

					// 6. エディタの値を更新
					onChange(newValue);

					// 7. カーソル位置を更新（画像Markdownの後ろに移動）
					setTimeout(() => {
						const newCursorPos = cursorPos + result.markdown.length;
						textarea.focus();
						textarea.setSelectionRange(newCursorPos, newCursorPos);
					}, 0);
				}
			} finally {
				uploadingRef.current = false;

				// 8. ファイル選択をリセット（同じファイルを再度選択できるようにする）
				input.value = "";
			}
		},
		[textareaRef, uploadImage, onChange]
	);

	const openFileDialog = useCallback(() => {
		// File inputが存在しない場合は作成
		if (!fileInputRef.current) {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/*";
			input.addEventListener("change", handleFileSelect);
			fileInputRef.current = input;
		}

		// ファイル選択ダイアログを開く
		fileInputRef.current.click();
	}, [handleFileSelect]);

	return { openFileDialog };
}
