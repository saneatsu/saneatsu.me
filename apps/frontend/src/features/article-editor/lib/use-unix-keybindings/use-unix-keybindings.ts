import { type RefObject, useEffect } from "react";

/**
 * Unix keybindings フックの設定
 */
interface UnixKeybindingsConfig {
	/** テキストエリアのref */
	textareaRef: RefObject<HTMLTextAreaElement>;
}

/**
 * Unix keybindings フック
 *
 * @description
 * textareaでのUnixスタイルのキーバインディングを提供するフック。
 * 以下の機能を含む：
 * - Ctrl+A: 現在行の先頭へ移動（Shiftと併用で選択）
 * - Ctrl+E: 現在行の末尾へ移動（Shiftと併用で選択）
 * - Ctrl+B: 1文字戻る（Shiftと併用で選択）
 * - Ctrl+F: 1文字進む（Shiftと併用で選択）
 */
export function useUnixKeybindings({ textareaRef }: UnixKeybindingsConfig) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const textarea = textareaRef.current;
			if (!textarea || document.activeElement !== textarea) return;

			// Unix keybindings は Ctrl のみ（Meta や Alt との組み合わせではない）
			if (!e.ctrlKey || e.metaKey || e.altKey) return;

			const value = textarea.value;
			const start = textarea.selectionStart;

			// Ctrl+A: 現在行の先頭へ移動（Shiftありの場合は選択）
			if (e.key === "a" || e.key === "A") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				// 現在のカーソル位置から行の先頭を探す
				const lineStart = value.lastIndexOf("\n", start - 1) + 1;

				if (e.shiftKey) {
					// Shiftキーが押されている場合は選択
					const selectionEnd = textarea.selectionEnd;
					textarea.setSelectionRange(lineStart, selectionEnd);
				} else {
					// Shiftキーが押されていない場合はカーソル移動のみ
					textarea.setSelectionRange(lineStart, lineStart);
				}
				return;
			}

			// Ctrl+E: 現在行の末尾へ移動（Shiftありの場合は選択）
			if (e.key === "e" || e.key === "E") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				// 現在のカーソル位置から行の末尾を探す
				let lineEnd = value.indexOf("\n", start);
				if (lineEnd === -1) lineEnd = value.length;

				if (e.shiftKey) {
					// Shiftキーが押されている場合は選択
					const selectionStart = textarea.selectionStart;
					textarea.setSelectionRange(selectionStart, lineEnd);
				} else {
					// Shiftキーが押されていない場合はカーソル移動のみ
					textarea.setSelectionRange(lineEnd, lineEnd);
				}
				return;
			}

			// Ctrl+B: 1文字戻る（Shiftありの場合は選択）
			if (e.key === "b" || e.key === "B") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				if (e.shiftKey) {
					// Shiftキーが押されている場合は選択範囲を左に拡張
					const selectionStart = textarea.selectionStart;
					const selectionEnd = textarea.selectionEnd;
					if (selectionStart > 0) {
						textarea.setSelectionRange(selectionStart - 1, selectionEnd);
					}
				} else {
					// Shiftキーが押されていない場合はカーソル移動のみ
					if (start > 0) {
						textarea.setSelectionRange(start - 1, start - 1);
					}
				}
				return;
			}

			// Ctrl+F: 1文字進む（Shiftありの場合は選択）
			if (e.key === "f" || e.key === "F") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				if (e.shiftKey) {
					// Shiftキーが押されている場合は選択範囲を右に拡張
					const selectionStart = textarea.selectionStart;
					const selectionEnd = textarea.selectionEnd;
					if (selectionEnd < value.length) {
						textarea.setSelectionRange(selectionStart, selectionEnd + 1);
					}
				} else {
					// Shiftキーが押されていない場合はカーソル移動のみ
					if (start < value.length) {
						textarea.setSelectionRange(start + 1, start + 1);
					}
				}
				return;
			}
		};

		// キャプチャフェーズで処理
		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [textareaRef]);
}
