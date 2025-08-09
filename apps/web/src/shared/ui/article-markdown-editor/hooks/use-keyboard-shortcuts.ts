import { useEffect } from "react";

/**
 * キーボードショートカットフックの設定
 */
interface KeyboardShortcutsConfig {
	/** Markdown値 */
	markdownValue: string;
	/** Markdown値を設定する関数 */
	setMarkdownValue: (value: string) => void;
	/** フォームのsetValue関数 */
	setValue: (name: string, value: string) => void;
}

/**
 * キーボードショートカット・括弧自動補完フック
 *
 * @description
 * MDEditor内でのキーボードショートカット、括弧の自動補完、
 * 対応する括弧のペア削除などの高度な編集機能を提供するフック。
 */
export function useKeyboardShortcuts({
	markdownValue: _markdownValue,
	setMarkdownValue,
	setValue,
}: KeyboardShortcutsConfig) {
	// キーボードショートカットと括弧の自動補完処理
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

		// 複数文字の括弧ペア（Wiki Link用）
		const _multiCharBrackets = {
			"[[": "]]",
		};

		// 対応する括弧を探す関数
		const findMatchingBracket = (
			value: string,
			position: number,
			bracket: string,
			isClosing: boolean
		): number => {
			// 複数文字の括弧をチェック
			if (bracket === "[" || bracket === "]") {
				// [[]] のペアをチェック
				if (
					isClosing &&
					position >= 1 &&
					value.substring(position - 1, position + 1) === "]]"
				) {
					// ]] を削除する場合、対応する [[ を探す
					let depth = 1;
					for (let i = position - 2; i >= 0; i--) {
						if (i >= 1 && value.substring(i - 1, i + 1) === "]]") {
							depth++;
						} else if (i >= 1 && value.substring(i - 1, i + 1) === "[[") {
							depth--;
							if (depth === 0) {
								return i - 1; // [[ の開始位置
							}
						} else if (
							i === 0 &&
							i < value.length - 1 &&
							value.substring(i, i + 2) === "[["
						) {
							// i = 0 の場合の特別処理
							depth--;
							if (depth === 0) {
								return i; // [[ の開始位置
							}
						}
					}
				} else if (
					!isClosing &&
					position < value.length - 1 &&
					value.substring(position, position + 2) === "[["
				) {
					// [[ を削除する場合、対応する ]] を探す
					let depth = 1;
					for (let i = position + 2; i <= value.length - 2; i++) {
						if (i <= value.length - 2 && value.substring(i, i + 2) === "[[") {
							depth++;
						} else if (
							i <= value.length - 2 &&
							value.substring(i, i + 2) === "]]"
						) {
							depth--;
							if (depth === 0) {
								return i; // ]] の開始位置
							}
						}
					}
				}
			}

			// 単一文字の括弧をチェック
			const openBracket = isClosing
				? Object.keys(bracketPairs).find((key) => bracketPairs[key] === bracket)
				: bracket;
			const closeBracket = isClosing ? bracket : bracketPairs[bracket];

			if (!openBracket || !closeBracket) return -1;

			if (isClosing) {
				// 閉じ括弧から開き括弧を探す
				let depth = 1;
				for (let i = position - 1; i >= 0; i--) {
					if (value[i] === closeBracket) {
						depth++;
					} else if (value[i] === openBracket) {
						depth--;
						if (depth === 0) {
							return i;
						}
					}
				}
			} else {
				// 開き括弧から閉じ括弧を探す
				let depth = 1;
				for (let i = position + 1; i < value.length; i++) {
					if (value[i] === openBracket) {
						depth++;
					} else if (value[i] === closeBracket) {
						depth--;
						if (depth === 0) {
							return i;
						}
					}
				}
			}

			return -1;
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const textarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (!textarea || document.activeElement !== textarea) return;

			// Ctrl+K または Cmd+K を無効化（カタカナ変換のため）
			if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
				e.stopPropagation(); // MDEditorのデフォルト動作を防ぐ
				return; // ブラウザのデフォルト動作は維持
			}

			// Cmd+L を無効化
			if (e.metaKey && (e.key === "l" || e.key === "L")) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			// Cmd+B でBoldフォーマット
			if (
				e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				(e.key === "b" || e.key === "B")
			) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がある場合のみBoldフォーマットを適用
				if (start !== end) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();

					const selectedText = value.substring(start, end);
					const beforeText = value.substring(0, start);
					const afterText = value.substring(end);

					// **で囲まれているかチェック
					const isBold =
						beforeText.endsWith("**") && afterText.startsWith("**");

					let newValue: string;
					let newStart: number, newEnd: number;

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

			// Unixキーバインドの実装
			if (e.ctrlKey && !e.metaKey && !e.altKey) {
				// Ctrl+B: カーソルを左へ移動
				if (e.key === "b" || e.key === "B") {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();

					const cursorPos = textarea.selectionStart;
					if (cursorPos > 0) {
						textarea.setSelectionRange(cursorPos - 1, cursorPos - 1);
					}
					return;
				}

				// Ctrl+F: カーソルを右へ移動
				if (e.key === "f" || e.key === "F") {
					e.preventDefault();
					e.stopPropagation();

					const cursorPos = textarea.selectionStart;
					if (cursorPos < textarea.value.length) {
						textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
					}
					return;
				}
			}

			// 括弧の自動補完処理
			// 開き括弧が入力された場合
			if (bracketPairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
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

			// バックスペースでのペア削除処理
			if (e.key === "Backspace" && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がない場合のみペア削除を考慮
				if (start === end && start > 0) {
					const charBefore = value.charAt(start - 1);
					const charAfter = value.charAt(start);

					// まず、カーソルが括弧ペアの間にある場合の処理
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

					// [[]] の間にカーソルがある場合
					if (
						start >= 2 &&
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

					// 削除される文字が括弧の場合、対応するペアも削除
					// ] を削除する場合
					if (charBefore === "]") {
						// ]] の一部かチェック
						if (start >= 2 && value.charAt(start - 2) === "]") {
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"]",
								true
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, matchingPos) +
									value.slice(matchingPos + 1, start - 1) +
									value.slice(start);

								// カーソル位置を計算：削除前の位置から削除された文字数を引く
								// 外側の括弧ペア（2文字）が削除されるので、元の位置から1を引く
								const newCursorPos = start - 1;

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の ] を削除
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"]",
								true
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, matchingPos) +
									value.slice(matchingPos + 1, start - 1) +
									value.slice(start);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								// カーソル位置を計算：削除された文字数を考慮
								// 開き括弧が削除されるので、元のカーソル位置から2文字分戻る
								const newCursorPos = start - 2;

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						}
					}
					// その他の閉じ括弧を削除する場合
					else if (closingBrackets.has(charBefore)) {
						const matchingPos = findMatchingBracket(
							value,
							start - 1,
							charBefore,
							true
						);
						if (matchingPos !== -1) {
							e.preventDefault();
							const newValue =
								value.slice(0, matchingPos) +
								value.slice(matchingPos + 1, start - 1) +
								value.slice(start);

							setMarkdownValue(newValue);
							setValue("content", newValue);

							// カーソル位置を計算：削除された文字数を考慮
							// 開き括弧が削除されるので、元のカーソル位置から2文字分戻る
							const newCursorPos = start - 2;

							setTimeout(() => {
								textarea.value = newValue;
								textarea.setSelectionRange(newCursorPos, newCursorPos);
								textarea.focus();
							}, 0);
							return;
						}
					}
					// [ を削除する場合
					else if (charBefore === "[") {
						// [[ の一部かチェック
						if (start >= 2 && value.charAt(start - 2) === "[") {
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"[",
								false
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, start - 1) +
									value.slice(start, matchingPos) +
									value.slice(matchingPos + 1);

								// カーソル位置を計算：削除前の位置から削除された文字数を引く
								// 外側の括弧ペア（2文字）が削除されるので、元の位置から1を引く
								const newCursorPos = start - 1;

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の [ を削除
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"[",
								false
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, start - 1) +
									value.slice(start, matchingPos) +
									value.slice(matchingPos + 1);

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
					// その他の開き括弧を削除する場合
					else if (bracketPairs[charBefore]) {
						const matchingPos = findMatchingBracket(
							value,
							start - 1,
							charBefore,
							false
						);
						if (matchingPos !== -1) {
							e.preventDefault();
							const newValue =
								value.slice(0, start - 1) +
								value.slice(start, matchingPos) +
								value.slice(matchingPos + 1);

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
			}

			// Ctrl+H または Cmd+H を検知
			if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
				e.preventDefault();
				e.stopPropagation();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				if (start === end && start > 0) {
					const charBefore = value.charAt(start - 1);
					const charAfter = value.charAt(start);

					// まず、カーソルが括弧ペアの間にある場合の処理
					if (
						bracketPairs[charBefore] &&
						bracketPairs[charBefore] === charAfter
					) {
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

					// [[]] の間にカーソルがある場合
					if (
						start >= 2 &&
						value.substring(start - 2, start) === "[[" &&
						value.substring(start, start + 2) === "]]"
					) {
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

					// 通常の削除処理（括弧ペアでない場合）
					const newValue = value.slice(0, start - 1) + value.slice(start);

					// 値を更新
					setMarkdownValue(newValue);
					setValue("content", newValue);

					// textareaの値も更新してカーソル位置を設定
					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start - 1, start - 1);
						textarea.focus();
					}, 0);
				} else if (start !== end) {
					// 選択範囲を削除
					const newValue = value.slice(0, start) + value.slice(end);

					// 値を更新
					setMarkdownValue(newValue);
					setValue("content", newValue);

					// textareaの値も更新してカーソル位置を設定
					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start, start);
						textarea.focus();
					}, 0);
				}
			}

			// Ctrl+D での前方削除処理（Deleteキーと同じ挙動）
			if (
				e.ctrlKey &&
				!e.metaKey &&
				!e.altKey &&
				(e.key === "d" || e.key === "D")
			) {
				e.preventDefault();
				e.stopPropagation();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がある場合は選択範囲を削除
				if (start !== end) {
					const newValue = value.slice(0, start) + value.slice(end);

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start, start);
						textarea.focus();
					}, 0);
					return;
				}

				// 選択範囲がない場合のペア削除を考慮
				if (start < value.length) {
					const charAfter = value.charAt(start);
					const charBefore = value.charAt(start - 1);

					// カーソルが括弧ペアの間にある場合の処理
					if (
						start > 0 &&
						bracketPairs[charBefore] &&
						bracketPairs[charBefore] === charAfter
					) {
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

					// 通常の前方削除（括弧ペアでない場合）
					const newValue = value.slice(0, start) + value.slice(start + 1);

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start, start);
						textarea.focus();
					}, 0);
				}
			}

			// Delete キーでのペア削除処理
			if (e.key === "Delete" && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がない場合のみペア削除を考慮
				if (start === end && start < value.length) {
					const charAfter = value.charAt(start);
					const charBefore = value.charAt(start - 1);

					// カーソルが括弧ペアの間にある場合の処理
					if (
						start > 0 &&
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

					// [[]] の間にカーソルがある場合
					if (
						start >= 2 &&
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
				}
			}
		};

		// キャプチャフェーズで処理
		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [setMarkdownValue, setValue]);
}
