/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWikiLinkDetection } from "./use-wiki-link-detection";

describe("useWikiLinkDetection", () => {
	describe("Unit Test", () => {
		let textarea: HTMLTextAreaElement;
		let textareaRef: React.RefObject<HTMLTextAreaElement | null>;
		let setShowSuggestions: ReturnType<typeof vi.fn>;
		let setSuggestionQuery: ReturnType<typeof vi.fn>;
		let setCursorPosition: ReturnType<typeof vi.fn>;
		let setIsHeadingSuggestion: ReturnType<typeof vi.fn>;
		let setTargetArticleSlug: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			// textareaを作成
			textarea = document.createElement("textarea");
			document.body.appendChild(textarea);

			// ref オブジェクトを作成
			textareaRef = { current: textarea };

			// モック関数を作成
			setShowSuggestions = vi.fn();
			setSuggestionQuery = vi.fn();
			setCursorPosition = vi.fn();
			setIsHeadingSuggestion = vi.fn();
			setTargetArticleSlug = vi.fn();
		});

		it("should show suggestions when [[ is typed and cursor is between [[]]", async () => {
			// フックをレンダリング
			renderHook(() =>
				useWikiLinkDetection({
					textareaRef,
					setShowSuggestions,
					setSuggestionQuery,
					setCursorPosition,
					setIsHeadingSuggestion,
					setTargetArticleSlug,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// [[]] の状態を設定（括弧自動補完後の状態）
			textarea.value = "[[]]";
			// カーソル位置を [[|]] に設定
			textarea.setSelectionRange(2, 2);

			// inputイベントを発火
			const inputEvent = new Event("input", { bubbles: true });
			textarea.dispatchEvent(inputEvent);

			// setTimeoutの実行を待つ
			await new Promise((resolve) => setTimeout(resolve, 20));

			// サジェストが表示されることを確認
			expect(setShowSuggestions).toHaveBeenCalledWith(true);
			expect(setSuggestionQuery).toHaveBeenCalledWith("");
			expect(setIsHeadingSuggestion).toHaveBeenCalledWith(false);
		});

		it("should not show suggestions when [[ is typed but cursor is not between [[]]", async () => {
			// フックをレンダリング
			renderHook(() =>
				useWikiLinkDetection({
					textareaRef,
					setShowSuggestions,
					setSuggestionQuery,
					setCursorPosition,
					setIsHeadingSuggestion,
					setTargetArticleSlug,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// [[ の状態を設定（カーソルが末尾）
			textarea.value = "[[";
			// カーソル位置を末尾に設定
			textarea.setSelectionRange(2, 2);

			// inputイベントを発火
			const inputEvent = new Event("input", { bubbles: true });
			textarea.dispatchEvent(inputEvent);

			// setTimeoutの実行を待つ
			await new Promise((resolve) => setTimeout(resolve, 20));

			// サジェストが表示されないことを確認
			expect(setShowSuggestions).toHaveBeenCalledWith(false);
		});

		it("should show suggestions when text is typed inside [[]]", async () => {
			// フックをレンダリング
			renderHook(() =>
				useWikiLinkDetection({
					textareaRef,
					setShowSuggestions,
					setSuggestionQuery,
					setCursorPosition,
					setIsHeadingSuggestion,
					setTargetArticleSlug,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// [[test]] の状態を設定
			textarea.value = "[[test]]";
			// カーソル位置を [[test|]] に設定
			textarea.setSelectionRange(6, 6);

			// inputイベントを発火
			const inputEvent = new Event("input", { bubbles: true });
			textarea.dispatchEvent(inputEvent);

			// setTimeoutの実行を待つ
			await new Promise((resolve) => setTimeout(resolve, 20));

			// サジェストが表示されることを確認
			expect(setShowSuggestions).toHaveBeenCalledWith(true);
			expect(setSuggestionQuery).toHaveBeenCalledWith("test");
			expect(setIsHeadingSuggestion).toHaveBeenCalledWith(false);
		});

		it("should hide suggestions when ]] is closed", async () => {
			// フックをレンダリング
			renderHook(() =>
				useWikiLinkDetection({
					textareaRef,
					setShowSuggestions,
					setSuggestionQuery,
					setCursorPosition,
					setIsHeadingSuggestion,
					setTargetArticleSlug,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// [[test]] の状態を設定（カーソルが末尾）
			textarea.value = "[[test]]";
			// カーソル位置を末尾に設定
			textarea.setSelectionRange(8, 8);

			// inputイベントを発火
			const inputEvent = new Event("input", { bubbles: true });
			textarea.dispatchEvent(inputEvent);

			// setTimeoutの実行を待つ
			await new Promise((resolve) => setTimeout(resolve, 20));

			// サジェストが非表示になることを確認
			expect(setShowSuggestions).toHaveBeenCalledWith(false);
		});
	});
});
