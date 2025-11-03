import { useEffect } from "react";

/**
 * クリック領域拡張フック
 *
 * @description
 * MDEditor全体の領域をクリックした際に、自動的にテキストエリアに
 * フォーカスしてカーソルを最後に移動するフック。
 * ツールバーやプレビューの特定要素など、通常のクリックが必要な
 * 部分は除外される。
 */
export function useClickExpansion() {
	// MDEditorのクリック領域拡張処理
	useEffect(() => {
		const handleEditorClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;

			// MDEditorのコンテナ内がクリックされた場合
			const editorContainer = target.closest(".w-md-editor");
			if (!editorContainer) return;

			// テキストエリア自体がクリックされた場合は何もしない
			if (
				target.classList.contains("w-md-editor-text-input") ||
				target.tagName === "TEXTAREA"
			) {
				return;
			}

			// Popover関連の要素がクリックされた場合は何もしない
			if (
				target.closest('[role="option"]') ||
				target.closest(".fixed.z-50") ||
				target.closest("[data-suggestion-index]")
			) {
				return;
			}

			// プレビュー側の特定の要素（リンクなど）がクリックされた場合は何もしない
			if (target.tagName === "A" || target.closest("a")) {
				return;
			}

			// ツールバーのボタンがクリックされた場合は何もしない
			if (target.closest(".w-md-editor-toolbar")) {
				return;
			}

			// ドラッグバーがクリックされた場合は何もしない
			if (target.closest(".w-md-editor-split")) {
				return;
			}

			// スクロールバーがクリックされた場合は何もしない
			if (target.closest(".w-md-editor-text-container")) {
				const rect = (
					target.closest(".w-md-editor-text-container") as HTMLElement
				).getBoundingClientRect();
				const clickX = e.clientX;
				const clickY = e.clientY;

				// スクロールバー領域をクリックした場合は何もしない
				if (clickX > rect.right - 20 || clickY > rect.bottom - 20) {
					return;
				}
			}

			// テキストエリアを探してフォーカス
			const textarea = editorContainer.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (textarea) {
				// preventDefaultはテキストエリアに実際にフォーカスする場合のみ
				e.preventDefault();
				textarea.focus();

				// カーソルを最後に移動
				const length = textarea.value.length;
				textarea.setSelectionRange(length, length);
			}
		};

		// クリックイベントリスナーを追加
		document.addEventListener("click", handleEditorClick);

		return () => {
			document.removeEventListener("click", handleEditorClick);
		};
	}, []);
}
