import { type RefObject, useEffect } from "react";
import getCaretCoordinates from "textarea-caret";

/**
 * Wiki Link検知フックの設定
 */
interface WikiLinkDetectionConfig {
	/** textareaのref */
	textareaRef: RefObject<HTMLTextAreaElement | null>;
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
 * textarea内でWiki Link記法（[[]]）を検知し、
 * 適切な位置にサジェストポップアップを表示するためのフック。
 * 記事サジェストと見出しサジェストの両方に対応。
 */
export function useWikiLinkDetection({
	textareaRef,
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
			const textarea = textareaRef.current;
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
				setShowSuggestions(false);
				return;
			}

			// [[以降のテキストを取得
			const afterBracket = value.substring(lastBracketIndex + 2, cursorPos);

			// ]]が含まれている場合は閉じられている
			if (afterBracket.includes("]]")) {
				setShowSuggestions(false);
				return;
			}

			// カーソル後の最初の]]を探す
			const closingBracketIndex = afterCursor.indexOf("]]");

			// カーソルの直後に]]がない場合はサジェスト非表示
			if (closingBracketIndex !== 0) {
				setShowSuggestions(false);
				return;
			}

			// カーソルの直後に]]がある場合はサジェスト表示

			// #が含まれているかチェック（見出しサジェスト）
			const hashIndex = afterBracket.indexOf("#");
			if (hashIndex !== -1) {
				// [[article-slug#heading-query]] の形式
				const articleSlug = afterBracket.substring(0, hashIndex);
				const headingQuery = afterBracket.substring(hashIndex + 1);

				// 記事スラッグが空の場合はサジェストを表示しない
				if (!articleSlug) {
					setShowSuggestions(false);
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

			// textarea-caretを使って正確なカーソル位置を取得
			// この方法により、textarea内のキャレット位置を正確に取得できる
			const caretCoordinates = getCaretCoordinates(textarea, cursorPos);
			const textareaRect = textarea.getBoundingClientRect();

			// textareaのpaddingを取得（p-4 = 1rem = 16px）
			// textarea-caretはpadding内側からの相対座標を返すため、paddingを加算する必要がある
			const computedStyle = window.getComputedStyle(textarea);
			const paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
			const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;

			const calculatedPosition = {
				// position:fixedなので、viewport基準の座標を使用（scrollは加算しない）
				// textareaのスクロール位置を考慮する必要がある
				top:
					textareaRect.top +
					paddingTop +
					caretCoordinates.top -
					textarea.scrollTop,
				left:
					textareaRect.left +
					paddingLeft +
					caretCoordinates.left -
					textarea.scrollLeft,
			};

			setCursorPosition(calculatedPosition);
		};

		const handleInput = (_e: Event) => {
			if (!isComposing) {
				// 少し遅延して処理を実行（入力処理の競合を避ける）
				// 括弧自動補完の処理を待つために20msの遅延を設定
				setTimeout(() => {
					checkWikiLink("input");
				}, 20);
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
				// 括弧自動補完の処理を待つために20msの遅延を設定
				setTimeout(() => {
					checkWikiLink("selectionchange");
				}, 20);
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

		// textareaRefからtextareaを取得してリスナーを設定
		const textarea = textareaRef.current;

		if (textarea) {
			attachListeners(textarea);
		}

		return () => {
			const currentTextarea = textareaRef.current;
			if (currentTextarea) {
				detachListeners(currentTextarea);
			}
		};
	}, [
		textareaRef,
		setCursorPosition,
		setIsHeadingSuggestion,
		setShowSuggestions,
		setSuggestionQuery, // 通常の記事サジェスト
		setTargetArticleSlug,
	]);
}
