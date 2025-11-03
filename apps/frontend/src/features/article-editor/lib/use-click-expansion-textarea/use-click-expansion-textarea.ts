import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * クリック領域拡張フックのプロパティ
 */
interface UseClickExpansionTextareaProps {
	/** エディタコンテナのref */
	editorRef: RefObject<HTMLDivElement>;
	/** textareaのref */
	textareaRef: RefObject<HTMLTextAreaElement>;
}

/**
 * クリック領域拡張フック（textarea版）
 *
 * @description
 * エディタコンテナ全体の領域をクリックした際に、自動的にテキストエリアに
 * フォーカスしてカーソルを最後に移動するフック。
 * Context Menuなど、通常のクリックが必要な部分は除外される。
 *
 * @param props - フックのプロパティ
 * @param props.editorRef - エディタコンテナのref
 * @param props.textareaRef - textareaのref
 */
export function useClickExpansionTextarea({
	editorRef,
	textareaRef,
}: UseClickExpansionTextareaProps) {
	useEffect(() => {
		// IME入力中かどうかのフラグ
		let isComposing = false;

		// 1. エディタコンテナのクリックイベントをリッスン
		const handleEditorClick = (e: MouseEvent) => {
			// IME入力中はクリックイベントを無視
			if (isComposing) {
				return;
			}
			const target = e.target as HTMLElement;
			const editorContainer = editorRef.current;
			const textarea = textareaRef.current;

			// 2. 必要な要素が存在しない場合は何もしない
			if (!editorContainer || !textarea) return;

			// 3. エディタコンテナ内がクリックされたか確認
			if (!editorContainer.contains(target)) return;

			// 4. textareaそのものがクリックされた場合は何もしない
			if (target === textarea || target.tagName === "TEXTAREA") {
				return;
			}

			// 5. Context Menu関連の要素がクリックされた場合は何もしない
			if (
				target.closest('[role="menu"]') ||
				target.closest("[data-radix-context-menu-content]") ||
				target.closest("[data-radix-popper-content-wrapper]")
			) {
				return;
			}

			// 6. リンクがクリックされた場合は何もしない
			if (target.tagName === "A" || target.closest("a")) {
				return;
			}

			// 7. スクロールバー領域がクリックされた場合は何もしない
			const rect = editorContainer.getBoundingClientRect();
			const clickX = e.clientX;
			const clickY = e.clientY;

			// スクロールバーの幅を考慮（一般的に15-20px）
			// ただし、rectが有効な場合のみチェック（テスト環境対策）
			if (rect.width > 0 && rect.height > 0) {
				if (clickX > rect.right - 20 || clickY > rect.bottom - 20) {
					return;
				}
			}

			// 8. textareaにフォーカスしてカーソルを最後に移動
			e.preventDefault();
			textarea.focus();

			const length = textarea.value.length;
			textarea.setSelectionRange(length, length);
		};

		// 9. IME入力イベントリスナーを追加
		const handleCompositionStart = () => {
			isComposing = true;
		};

		const handleCompositionEnd = () => {
			isComposing = false;
		};

		const textarea = textareaRef.current;
		if (textarea) {
			textarea.addEventListener("compositionstart", handleCompositionStart);
			textarea.addEventListener("compositionend", handleCompositionEnd);
		}

		// 10. クリックイベントリスナーを追加
		document.addEventListener("click", handleEditorClick);

		// 11. クリーンアップ関数を返す
		return () => {
			document.removeEventListener("click", handleEditorClick);
			if (textarea) {
				textarea.removeEventListener(
					"compositionstart",
					handleCompositionStart
				);
				textarea.removeEventListener("compositionend", handleCompositionEnd);
			}
		};
	}, [editorRef, textareaRef]);
}
