import { useEffect } from "react";

/**
 * タグ検知フックの設定
 */
interface TagDetectionConfig {
	/** タグサジェストを表示するかどうか */
	showTagSuggestions: boolean;
	/** タグサジェスト表示状態を設定する関数 */
	setShowTagSuggestions: (show: boolean) => void;
	/** タグクエリを設定する関数 */
	setTagQuery: (query: string) => void;
	/** タグカーソル位置を設定する関数 */
	setTagCursorPosition: (position: { top: number; left: number }) => void;
}

/**
 * タグ検知フック
 *
 * @description
 * MDEditor内のテキストエリアでタグ記法（#tag）を検知し、
 * 適切な位置にタグサジェストポップアップを表示するためのフック。
 * Wiki Link内でのタグ検知は除外される。
 */
export function useTagDetection({
	showTagSuggestions,
	setShowTagSuggestions,
	setTagQuery,
	setTagCursorPosition,
}: TagDetectionConfig) {
	// タグ検知用のイベントリスナー
	useEffect(() => {
		let isComposing = false;

		const checkTag = (_source: string) => {
			const textarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (!textarea) return;

			// textareaの値を直接使用
			const value = textarea.value;
			const cursorPos = textarea.selectionStart;

			// カーソル位置より前のテキストのみ処理
			const beforeCursor = value.substring(0, cursorPos);

			// カーソル位置の直前2文字が ]] かチェック
			if (
				cursorPos >= 2 &&
				value.substring(cursorPos - 2, cursorPos) === "]]"
			) {
				// ]]の直後にカーソルがある場合はタグサジェストを表示しない
				if (showTagSuggestions) {
					setShowTagSuggestions(false);
				}
				return;
			}

			// カーソルがWiki Link内にあるかチェック
			const lastWikiLinkStart = beforeCursor.lastIndexOf("[[");

			if (lastWikiLinkStart !== -1) {
				// [[の後のテキストを取得
				const afterWikiLinkStart = value.substring(lastWikiLinkStart);
				// ]]の位置を探す
				const wikiLinkEnd = afterWikiLinkStart.indexOf("]]");

				if (wikiLinkEnd !== -1) {
					// Wiki Link全体の終了位置（2つ目の]の位置）
					const wikiLinkEndAbsolute = lastWikiLinkStart + wikiLinkEnd + 1;

					// カーソルがWiki Link内にある場合（]]の間も含む）
					if (
						cursorPos >= lastWikiLinkStart &&
						cursorPos <= wikiLinkEndAbsolute
					) {
						// Wiki Link内にカーソルがある場合はタグサジェストを表示しない
						if (showTagSuggestions) {
							setShowTagSuggestions(false);
						}
						return;
					}
				}
			}

			// #の検出（最後の#のみ）
			const lastHashIndex = beforeCursor.lastIndexOf("#");

			if (lastHashIndex === -1) {
				// #が見つからない場合は非表示
				if (showTagSuggestions) {
					setShowTagSuggestions(false);
				}
				return;
			}

			// #以降のテキストを取得
			const afterHash = value.substring(lastHashIndex + 1, cursorPos);

			// スペース、改行、または他の区切り文字が含まれている場合は閉じられている
			if (afterHash.match(/[\s\n\r\t]/)) {
				if (showTagSuggestions) {
					setShowTagSuggestions(false);
				}
				return;
			}

			// 空のクエリ（#のみ）の場合はサジェストを表示しない
			if (afterHash.length === 0) {
				if (showTagSuggestions) {
					setShowTagSuggestions(false);
				}
				return;
			}

			// サジェストを表示
			setTagQuery(afterHash);
			setShowTagSuggestions(true);

			// カーソル位置を計算（シンプル化）
			const rect = textarea.getBoundingClientRect();
			const lineHeight = 20;
			const charWidth = 8;

			// 改行数をカウント
			const lines = beforeCursor.split("\n").length;

			// 現在の行での#の位置
			const lastLineStart = beforeCursor.lastIndexOf("\n") + 1;
			const currentLineText = beforeCursor.substring(lastLineStart);
			const hashPosInLine = currentLineText.lastIndexOf("#");

			setTagCursorPosition({
				top: rect.top + lines * lineHeight,
				left: rect.left + hashPosInLine * charWidth,
			});
		};

		const handleInput = (_e: Event) => {
			if (!isComposing) {
				// 少し遅延して処理を実行（入力処理の競合を避ける）
				setTimeout(() => {
					checkTag("input");
				}, 0);
			}
		};

		const handleCompositionStart = () => {
			isComposing = true;
		};

		const handleCompositionEnd = () => {
			isComposing = false;
			// IME確定後、MDEditorの内部処理を待ってからチェック
			setTimeout(() => {
				checkTag("compositionend");
			}, 100);
		};

		const handleSelectionChange = () => {
			// カーソル位置が変更されたらチェック
			if (!isComposing) {
				checkTag("selectionchange");
			}
		};

		// textareaにイベントリスナーを追加する関数
		const attachListeners = (textarea: HTMLTextAreaElement) => {
			textarea.addEventListener("input", handleInput);
			textarea.addEventListener("compositionstart", handleCompositionStart);
			textarea.addEventListener("compositionend", handleCompositionEnd);
			// selectionchangeはdocumentレベルで監視
			document.addEventListener("selectionchange", handleSelectionChange);
		};

		// textareaからイベントリスナーを削除する関数
		const detachListeners = (textarea: HTMLTextAreaElement) => {
			textarea.removeEventListener("input", handleInput);
			textarea.removeEventListener("compositionstart", handleCompositionStart);
			textarea.removeEventListener("compositionend", handleCompositionEnd);
			document.removeEventListener("selectionchange", handleSelectionChange);
		};

		// 初期のtextareaを探す
		const textarea = document.querySelector(
			".w-md-editor-text-input"
		) as HTMLTextAreaElement;

		if (textarea) {
			attachListeners(textarea);
		}

		// MutationObserverでtextareaの出現を監視
		const observer = new MutationObserver(() => {
			const newTextarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (newTextarea && !newTextarea.dataset.tagListener) {
				// 既存のリスナーをクリーンアップ
				const existingTextareas = document.querySelectorAll(
					".w-md-editor-text-input[data-tag-listener]"
				);
				existingTextareas.forEach((ta) => {
					detachListeners(ta as HTMLTextAreaElement);
					delete (ta as HTMLTextAreaElement).dataset.tagListener;
				});

				newTextarea.dataset.tagListener = "true";
				attachListeners(newTextarea);
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
			const currentTextarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (currentTextarea) {
				detachListeners(currentTextarea);
			}
			// documentレベルのイベントリスナーもクリーンアップ
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [
		showTagSuggestions,
		setShowTagSuggestions,
		setTagQuery,
		setTagCursorPosition,
	]);
}
