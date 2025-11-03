import { type RefObject, useEffect } from "react";

/**
 * 括弧自動補完フックの設定
 */
interface BracketCompletionConfig {
	/** テキストエリアのref */
	textareaRef: RefObject<HTMLTextAreaElement>;
	/** Markdown値を設定する関数 */
	setMarkdownValue: (value: string) => void;
	/** フォームのsetValue関数 */
	setValue: (name: string, value: string) => void;
}

/**
 * 括弧自動補完フック
 *
 * @description
 * textareaでの括弧の自動補完機能を提供するフック。
 * 以下の機能を含む：
 * - 開き括弧入力時の自動補完 (`[` → `[]`)
 * - Wiki Link用の特殊補完 (`[[` → `[[]]`)
 * - 選択範囲を括弧で囲む
 * - 閉じ括弧のスキップ
 */
export function useBracketCompletion({
	textareaRef,
	setMarkdownValue,
	setValue,
}: BracketCompletionConfig) {
	useEffect(() => {
		// 括弧のペアを定義
		const bracketPairs: { [key: string]: string } = {
			"[": "]",
			"(": ")",
			"{": "}",
			"`": "`",
			'"': '"',
			"'": "'",
		};

		// 閉じ括弧の定義
		const closingBrackets = new Set(Object.values(bracketPairs));

		const handleKeyDown = (e: KeyboardEvent) => {
			const textarea = textareaRef.current;
			if (!textarea || document.activeElement !== textarea) return;

			// 括弧の自動補完処理
			// 開き括弧が入力された場合（Shiftキーが押されている場合は除外）
			if (
				bracketPairs[e.key] &&
				!e.ctrlKey &&
				!e.metaKey &&
				!e.altKey &&
				!e.shiftKey
			) {
				e.preventDefault();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;
				const selectedText = value.substring(start, end);

				// [[ の場合は [[]] に補完
				if (e.key === "[" && start > 0 && value.charAt(start - 1) === "[") {
					// カーソルの直後に ] がある場合は削除する（[] の中で [ を押した場合）
					let endPos = end;
					if (value.charAt(end) === "]") {
						endPos = end + 1;
					}

					const newValue =
						value.slice(0, start) +
						"[" +
						selectedText +
						"]]" +
						value.slice(endPos);
					const newCursorPos = start + 1 + selectedText.length;

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						if (selectedText) {
							// テキストが選択されていた場合は、そのテキストを選択状態にする
							textarea.setSelectionRange(
								start + 1,
								start + 1 + selectedText.length
							);
						} else {
							// テキストが選択されていない場合は、括弧の間にカーソルを配置
							textarea.setSelectionRange(newCursorPos, newCursorPos);
						}
						textarea.focus();
					}, 0);
				} else {
					// 通常の括弧補完
					const closingBracket = bracketPairs[e.key];
					const newValue =
						value.slice(0, start) +
						e.key +
						selectedText +
						closingBracket +
						value.slice(end);
					const newCursorPos = start + 1 + selectedText.length;

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						if (selectedText) {
							// テキストが選択されていた場合は、そのテキストを選択状態にする
							textarea.setSelectionRange(
								start + 1,
								start + 1 + selectedText.length
							);
						} else {
							// テキストが選択されていない場合は、括弧の間にカーソルを配置
							textarea.setSelectionRange(newCursorPos, newCursorPos);
						}
						textarea.focus();
					}, 0);
				}
				return;
			}

			// 閉じ括弧のスキップ処理
			if (closingBrackets.has(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const value = textarea.value;

				// カーソルの直後が同じ閉じ括弧の場合はスキップ
				if (start < value.length && value.charAt(start) === e.key) {
					e.preventDefault();
					textarea.setSelectionRange(start + 1, start + 1);
					return;
				}
			}

			// Backspaceでの括弧ペア削除処理
			if (e.key === "Backspace" && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がない場合のみペア削除を考慮
				if (start === end && start > 0) {
					const charBefore = value.charAt(start - 1);
					const charAfter = value.charAt(start);

					// [[ と ]] のペアをチェック
					if (
						start >= 2 &&
						start < value.length - 1 &&
						value.substring(start - 2, start) === "[[" &&
						value.substring(start, start + 2) === "]]"
					) {
						e.preventDefault();
						const newValue = value.slice(0, start - 2) + value.slice(start + 2);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 2, start - 2);
							textarea.focus();
						}, 0);
						return;
					}

					// 通常の括弧ペアをチェック
					if (
						bracketPairs[charBefore] &&
						bracketPairs[charBefore] === charAfter
					) {
						e.preventDefault();
						const newValue = value.slice(0, start - 1) + value.slice(start + 1);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 1, start - 1);
							textarea.focus();
						}, 0);
						return;
					}
				}
			}

			// Deleteでの括弧ペア削除処理
			if (e.key === "Delete" && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がない場合のみペア削除を考慮
				if (start === end && start > 0 && start < value.length) {
					const charBefore = value.charAt(start - 1);
					const charAfter = value.charAt(start);

					// 括弧ペアの間にいる場合
					if (
						bracketPairs[charBefore] &&
						bracketPairs[charBefore] === charAfter
					) {
						e.preventDefault();
						const newValue = value.slice(0, start - 1) + value.slice(start + 1);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 1, start - 1);
							textarea.focus();
						}, 0);
						return;
					}
				}
			}
		};

		// キャプチャフェーズで処理
		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [textareaRef, setMarkdownValue, setValue]);
}
