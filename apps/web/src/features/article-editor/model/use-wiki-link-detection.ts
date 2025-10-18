import { useEffect } from "react";

/**
 * Wiki Link検知フックの設定
 */
interface WikiLinkDetectionConfig {
	/** サジェストを表示するかどうか */
	showSuggestions: boolean;
	/** サジェスト表示状態を設定する関数 */
	setShowSuggestions: (show: boolean) => void;
	/** サジェストクエリを設定する関数 */
	setSuggestionQuery: (query: string) => void;
	/** カーソル位置を設定する関数 */
	setCursorPosition: (position: { top: number; left: number }) => void;
	/** 見出しサジェストモードを設定する関数 */
	setIsHeadingSuggestion: (isHeading: boolean) => void;
	/** ターゲット記事スラッグを設定する関数 */
	setTargetArticleSlug: (slug: string) => void;
}

/**
 * Wiki Link検知フック
 *
 * @description
 * MDEditor内のテキストエリアでWiki Link記法（[[]]）を検知し、
 * 適切な位置にサジェストポップアップを表示するためのフック。
 * 記事サジェストと見出しサジェストの両方に対応。
 */
export function useWikiLinkDetection({
	showSuggestions,
	setShowSuggestions,
	setSuggestionQuery,
	setCursorPosition,
	setIsHeadingSuggestion,
	setTargetArticleSlug,
}: WikiLinkDetectionConfig) {
	// Wiki Link検知用のイベントリスナー
	useEffect(() => {
		let isComposing = false;

		const checkWikiLink = (_source: string) => {
			const textarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (!textarea) {
				return;
			}

			// textareaの値を直接使用
			const value = textarea.value;
			const cursorPos = textarea.selectionStart;

			// カーソル位置より前のテキストのみ処理
			const beforeCursor = value.substring(0, cursorPos);
			const afterCursor = value.substring(cursorPos);

			// [[の検出（最後の[[のみ）
			const lastBracketIndex = beforeCursor.lastIndexOf("[[");

			if (lastBracketIndex === -1) {
				// [[が見つからない場合は非表示
				if (showSuggestions) {
					setShowSuggestions(false);
				}
				return;
			}

			// [[以降のテキストを取得
			const afterBracket = value.substring(lastBracketIndex + 2, cursorPos);

			// ]]が含まれている場合は閉じられている
			if (afterBracket.includes("]]")) {
				if (showSuggestions) {
					setShowSuggestions(false);
				}
				return;
			}

			// カーソル後の最初の]]を探す
			const closingBracketIndex = afterCursor.indexOf("]]");

			// カーソルが]]より前に文字がある場合のみ非表示
			// （例: `[[test]]more` でカーソルが "e]" の間にある場合）
			if (closingBracketIndex > 0) {
				if (showSuggestions) {
					setShowSuggestions(false);
				}
				return;
			}

			// ]]が見つからない場合（[[入力中）またはカーソルが空のWiki Link内にある場合はサジェスト表示

			// #が含まれているかチェック（見出しサジェスト）
			const hashIndex = afterBracket.indexOf("#");
			if (hashIndex !== -1) {
				// [[article-slug#heading-query]] の形式
				const articleSlug = afterBracket.substring(0, hashIndex);
				const headingQuery = afterBracket.substring(hashIndex + 1);

				// 記事スラッグが空の場合はサジェストを表示しない
				if (!articleSlug) {
					if (showSuggestions) {
						setShowSuggestions(false);
					}
					return;
				}

				setTargetArticleSlug(articleSlug);
				setSuggestionQuery(headingQuery || ""); // 空文字列でも全見出しを表示
				setIsHeadingSuggestion(true);
				setShowSuggestions(true);
			} else {
				// 通常の記事サジェスト
				setTargetArticleSlug("");
				setSuggestionQuery(afterBracket);
				setIsHeadingSuggestion(false);
				setShowSuggestions(true);
			}

			// より正確なカーソル位置を計算
			const rect = textarea.getBoundingClientRect();

			// テキストエリアのスタイルから実際のフォントサイズと行高を取得
			const computedStyle = window.getComputedStyle(textarea);
			const fontSize = parseInt(computedStyle.fontSize) || 16;
			const lineHeight = parseInt(computedStyle.lineHeight) || fontSize * 1.5;

			// 改行数をカウント
			const lines = beforeCursor.split("\n").length;

			// 現在の行でのカーソル位置（[[の位置ではなく実際のカーソル位置）
			const lastLineStart = beforeCursor.lastIndexOf("\n") + 1;
			const currentLineText = beforeCursor.substring(lastLineStart);

			// より正確な文字幅を計算（モノスペースフォントでない場合も考慮）
			const charWidth = fontSize * 0.6; // 大まかな文字幅の推定

			const calculatedPosition = {
				top: rect.top + window.scrollY + (lines - 1) * lineHeight,
				left: rect.left + window.scrollX + currentLineText.length * charWidth,
			};
			setCursorPosition(calculatedPosition);
		};

		const handleInput = (_e: Event) => {
			if (!isComposing) {
				// 少し遅延して処理を実行（入力処理の競合を避ける）
				setTimeout(() => {
					checkWikiLink("input");
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
				checkWikiLink("compositionend");
			}, 100);
		};

		const handleSelectionChange = () => {
			// カーソル位置が変更されたらチェック
			if (!isComposing) {
				checkWikiLink("selectionchange");
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
			if (newTextarea && !newTextarea.dataset.wikiLinkListener) {
				// 既存のリスナーをクリーンアップ
				const existingTextareas = document.querySelectorAll(
					".w-md-editor-text-input[data-wiki-link-listener]"
				);
				existingTextareas.forEach((ta) => {
					detachListeners(ta as HTMLTextAreaElement);
					delete (ta as HTMLTextAreaElement).dataset.wikiLinkListener;
				});

				newTextarea.dataset.wikiLinkListener = "true";
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
		showSuggestions,
		setShowSuggestions,
		setSuggestionQuery,
		setCursorPosition,
		setIsHeadingSuggestion,
		setTargetArticleSlug,
	]);
}
