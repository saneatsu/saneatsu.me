import { type RefObject, useEffect } from "react";

/**
 * Markdownフォーマットフックの設定
 */
interface MarkdownFormattingConfig {
	/** テキストエリアのref */
	textareaRef: RefObject<HTMLTextAreaElement | null>;
	/** Markdown値を設定する関数 */
	setMarkdownValue: (value: string) => void;
	/** フォームのsetValue関数 */
	setValue: (name: string, value: string) => void;
}

/**
 * Markdownフォーマットフック
 *
 * @description
 * textareaでのMarkdownフォーマット機能を提供するフック。
 * 以下の機能を含む：
 * - Cmd+B: Bold（**text**）
 * - Cmd+I: Italic（*text*）
 */
export function useMarkdownFormatting({
	textareaRef,
	setMarkdownValue,
	setValue,
}: MarkdownFormattingConfig) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const textarea = textareaRef.current;
			if (!textarea || document.activeElement !== textarea) return;

			// Cmd+B でBoldフォーマット
			if (
				e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				(e.key === "b" || e.key === "B")
			) {
				// デフォルトの動作を防ぐ
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がある場合のみBoldフォーマットを適用
				if (start !== end) {
					const selectedText = value.substring(start, end);
					const beforeText = value.substring(0, start);
					const afterText = value.substring(end);

					// **で囲まれているかチェック
					const isBold =
						beforeText.endsWith("**") && afterText.startsWith("**");

					let newValue: string;
					let newStart: number;
					let newEnd: number;

					if (isBold) {
						// Bold解除
						newValue =
							beforeText.slice(0, -2) + selectedText + afterText.slice(2);
						newStart = start - 2;
						newEnd = end - 2;
					} else {
						// Bold適用
						newValue = `${beforeText}**${selectedText}**${afterText}`;
						newStart = start + 2;
						newEnd = end + 2;
					}

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(newStart, newEnd);
						textarea.focus();
					}, 0);
				}
				return;
			}

			// Cmd+I でItalicフォーマット
			if (
				e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				(e.key === "i" || e.key === "I")
			) {
				// デフォルトの動作を防ぐ
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がある場合のみItalicフォーマットを適用
				if (start !== end) {
					const selectedText = value.substring(start, end);
					const beforeText = value.substring(0, start);
					const afterText = value.substring(end);

					// *で囲まれているかチェック
					const isItalic =
						beforeText.endsWith("*") && afterText.startsWith("*");

					let newValue: string;
					let newStart: number;
					let newEnd: number;

					if (isItalic) {
						// Italic解除
						newValue =
							beforeText.slice(0, -1) + selectedText + afterText.slice(1);
						newStart = start - 1;
						newEnd = end - 1;
					} else {
						// Italic適用
						newValue = `${beforeText}*${selectedText}*${afterText}`;
						newStart = start + 1;
						newEnd = end + 1;
					}

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(newStart, newEnd);
						textarea.focus();
					}, 0);
				}
				return;
			}
		};

		// キャプチャフェーズで処理
		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [textareaRef, setMarkdownValue, setValue]);
}
