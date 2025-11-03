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
 * - Ctrl+A: 現在行の先頭へ移動
 * - Ctrl+E: 現在行の末尾へ移動
 * - Ctrl+B: 1文字戻る
 * - Ctrl+F: 1文字進む
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

			// Ctrl+A: 現在行の先頭へ移動
			if (e.key === "a" || e.key === "A") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				// 現在のカーソル位置から行の先頭を探す
				const lineStart = value.lastIndexOf("\n", start - 1) + 1;
				textarea.setSelectionRange(lineStart, lineStart);
				return;
			}

			// Ctrl+E: 現在行の末尾へ移動
			if (e.key === "e" || e.key === "E") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				// 現在のカーソル位置から行の末尾を探す
				let lineEnd = value.indexOf("\n", start);
				if (lineEnd === -1) lineEnd = value.length;
				textarea.setSelectionRange(lineEnd, lineEnd);
				return;
			}

			// Ctrl+B: 1文字戻る
			if (e.key === "b" || e.key === "B") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				if (start > 0) {
					textarea.setSelectionRange(start - 1, start - 1);
				}
				return;
			}

			// Ctrl+F: 1文字進む
			if (e.key === "f" || e.key === "F") {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				if (start < value.length) {
					textarea.setSelectionRange(start + 1, start + 1);
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
