import { type RefObject, useEffect } from "react";

/**
 * リスト自動継続フックの設定
 */
interface ListAutoContinuationConfig {
	/** テキストエリアのref */
	textareaRef: RefObject<HTMLTextAreaElement>;
	/** Markdown値を設定する関数 */
	setMarkdownValue: (value: string) => void;
	/** フォームのsetValue関数 */
	setValue: (name: string, value: string) => void;
}

/**
 * リストタイプの型定義
 */
type ListType = {
	type: "bullet" | "ordered" | "checkbox";
	indent: string;
	marker: string;
	number?: number;
	checked?: boolean;
} | null;

/**
 * リスト自動継続フック
 *
 * @description
 * textareaでのリスト項目の自動継続機能を提供するフック。
 * 以下の機能を含む：
 * - Enterキー押下時の挙動
 *   - 箇条書き: 新しい箇条書き項目を作成
 *   - 番号付きリスト: 番号をインクリメントして新しい項目を作成
 *   - チェックボックス: 新しい未チェックボックスを作成
 *   - 空のリスト項目: リストから抜ける（マーカーを削除）
 */
export function useListAutoContinuation({
	textareaRef,
	setMarkdownValue,
	setValue,
}: ListAutoContinuationConfig) {
	useEffect(() => {
		/**
		 * 現在の行を取得するヘルパー関数
		 */
		const getCurrentLine = (value: string, position: number): string => {
			const lines = value.substring(0, position).split("\n");
			return lines[lines.length - 1];
		};

		/**
		 * リストタイプを検出するヘルパー関数
		 */
		const detectListType = (line: string): ListType => {
			// チェックボックス: `- [ ]` or `- [x]`
			const checkboxMatch = line.match(/^(\s*)([-*+])(\s+)\[([ xX])\](\s*)/);
			if (checkboxMatch) {
				return {
					type: "checkbox",
					indent: checkboxMatch[1],
					marker: checkboxMatch[2],
					checked: checkboxMatch[4].toLowerCase() === "x",
				};
			}

			// 番号付きリスト: `1.`
			const orderedMatch = line.match(/^(\s*)(\d+)\.(\s+)/);
			if (orderedMatch) {
				return {
					type: "ordered",
					indent: orderedMatch[1],
					marker: ".",
					number: parseInt(orderedMatch[2], 10),
				};
			}

			// 箇条書き: `-`, `*`, `+`
			const bulletMatch = line.match(/^(\s*)([-*+])(\s+)/);
			if (bulletMatch) {
				return {
					type: "bullet",
					indent: bulletMatch[1],
					marker: bulletMatch[2],
				};
			}

			return null;
		};

		/**
		 * リスト項目が空かどうかを判定
		 */
		const isEmptyListItem = (line: string, listType: ListType): boolean => {
			if (!listType) return false;

			switch (listType.type) {
				case "checkbox":
					// チェックボックスの後に内容がない
					return /^(\s*)([-*+])(\s+)\[([ xX])\](\s*)$/.test(line);
				case "ordered":
					// 番号の後に内容がない
					return /^(\s*)(\d+)\.(\s*)$/.test(line);
				case "bullet":
					// マーカーの後に内容がない
					return /^(\s*)([-*+])(\s*)$/.test(line);
				default:
					return false;
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const textarea = textareaRef.current;
			if (!textarea || document.activeElement !== textarea) return;

			// Enterキーの処理（リスト項目の自動継続）
			if (
				e.key === "Enter" &&
				!e.shiftKey &&
				!e.ctrlKey &&
				!e.metaKey &&
				!e.altKey
			) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がある場合は通常のEnterキー動作
				if (start !== end) return;

				const currentLine = getCurrentLine(value, start);
				const listType = detectListType(currentLine);

				if (listType) {
					e.preventDefault();

					// 現在の行の開始位置を取得
					const lineStart = value.lastIndexOf("\n", start - 1) + 1;
					const lineEnd = start;

					if (isEmptyListItem(currentLine, listType)) {
						// 空のリスト項目 → リストから抜ける
						const newValue = value.slice(0, lineStart) + value.slice(lineEnd);
						const newCursorPos = lineStart;

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(newCursorPos, newCursorPos);
							textarea.focus();
						}, 0);
					} else {
						// 内容があるリスト項目 → 新しいリスト項目を作成
						let newListItem = "";

						switch (listType.type) {
							case "bullet":
								newListItem = `${listType.indent}${listType.marker} `;
								break;
							case "ordered": {
								// 番号をインクリメント
								const nextNumber = (listType.number || 1) + 1;
								newListItem = `${listType.indent}${nextNumber}. `;
								break;
							}
							case "checkbox":
								// 新しいチェックボックスは常に未チェック
								newListItem = `${listType.indent}${listType.marker} [ ] `;
								break;
						}

						const newValue = `${value.slice(0, start)}\n${newListItem}${value.slice(end)}`;
						const newCursorPos = start + 1 + newListItem.length;

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(newCursorPos, newCursorPos);
							textarea.focus();
						}, 0);
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
