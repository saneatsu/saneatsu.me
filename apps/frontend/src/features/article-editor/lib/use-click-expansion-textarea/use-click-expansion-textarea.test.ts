import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useClickExpansionTextarea } from "./use-click-expansion-textarea";

describe("useClickExpansionTextarea", () => {
	describe("Unit Test", () => {
		let editorContainer: HTMLDivElement;
		let textarea: HTMLTextAreaElement;
		let editorRef: React.RefObject<HTMLDivElement>;
		let textareaRef: React.RefObject<HTMLTextAreaElement>;

		beforeEach(() => {
			// エディタコンテナを作成
			editorContainer = document.createElement("div");
			editorContainer.className = "editor-container";
			document.body.appendChild(editorContainer);

			// textareaを作成
			textarea = document.createElement("textarea");
			textarea.value = "Hello World";
			editorContainer.appendChild(textarea);

			// ref オブジェクトを作成
			editorRef = { current: editorContainer };
			textareaRef = { current: textarea };
		});

		it("should focus textarea when editor container is clicked", () => {
			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// focusとsetSelectionRangeをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");
			const setSelectionRangeSpy = vi.spyOn(textarea, "setSelectionRange");

			// エディタコンテナの境界を取得
			const rect = editorContainer.getBoundingClientRect();

			// エディタコンテナをクリック（MouseEventを手動でディスパッチ）
			// エディタコンテナの中心をクリック
			const clickEvent = new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
			});
			editorContainer.dispatchEvent(clickEvent);

			// textareaがフォーカスされたことを確認
			expect(focusSpy).toHaveBeenCalledTimes(1);

			// カーソルが最後に移動したことを確認
			expect(setSelectionRangeSpy).toHaveBeenCalledWith(11, 11); // "Hello World" の長さは11
		});

		it("should move cursor to the end when editor container is clicked", () => {
			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// setSelectionRangeをスパイ
			const setSelectionRangeSpy = vi.spyOn(textarea, "setSelectionRange");

			// エディタコンテナの境界を取得
			const rect = editorContainer.getBoundingClientRect();

			// エディタコンテナをクリック（MouseEventを手動でディスパッチ）
			// エディタコンテナの中心をクリック
			const clickEvent = new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
			});
			editorContainer.dispatchEvent(clickEvent);

			// カーソルが最後（11文字目）に移動したことを確認
			expect(setSelectionRangeSpy).toHaveBeenCalledWith(11, 11);
		});

		it("should not interfere when textarea itself is clicked", () => {
			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// focusをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");

			// カーソルを途中に設定
			textarea.setSelectionRange(5, 5);

			// textarea自体をクリック（デフォルトの動作をシミュレート）
			textarea.click();

			// focus()が呼ばれていないことを確認（デフォルトの動作に任せる）
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("should not focus textarea when context menu element is clicked", () => {
			// Context Menu要素を作成
			const contextMenu = document.createElement("div");
			contextMenu.setAttribute("role", "menu");
			editorContainer.appendChild(contextMenu);

			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// focusをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");

			// Context Menuをクリック
			contextMenu.click();

			// textareaがフォーカスされていないことを確認
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("should not focus textarea when link is clicked", () => {
			// リンク要素を作成
			const link = document.createElement("a");
			link.href = "#";
			link.textContent = "Link";
			editorContainer.appendChild(link);

			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// focusをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");

			// リンクをクリック
			link.click();

			// textareaがフォーカスされていないことを確認
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("should not focus textarea when clicking outside editor container", () => {
			// エディタコンテナの外側に要素を作成
			const outsideElement = document.createElement("div");
			document.body.appendChild(outsideElement);

			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// focusをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");

			// 外側の要素をクリック
			outsideElement.click();

			// textareaがフォーカスされていないことを確認
			expect(focusSpy).not.toHaveBeenCalled();

			// クリーンアップ
			document.body.removeChild(outsideElement);
		});

		it("should do nothing when editorRef is null", () => {
			// editorRefをnullに設定
			const nullEditorRef = { current: null };

			// フックをレンダリング
			renderHook(() =>
				useClickExpansionTextarea({
					editorRef: nullEditorRef,
					textareaRef,
				})
			);

			// focusをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");

			// エディタコンテナをクリック
			editorContainer.click();

			// textareaがフォーカスされていないことを確認
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("should do nothing when textareaRef is null", () => {
			// textareaRefをnullに設定
			const nullTextareaRef = { current: null };

			// フックをレンダリング
			renderHook(() =>
				useClickExpansionTextarea({
					editorRef,
					textareaRef: nullTextareaRef,
				})
			);

			// エディタコンテナをクリック（エラーが発生しないことを確認）
			expect(() => {
				editorContainer.click();
			}).not.toThrow();
		});

		it("should not focus textarea when Radix UI context menu content is clicked", () => {
			// Radix UI Context Menu Content要素を作成
			const contextMenuContent = document.createElement("div");
			contextMenuContent.setAttribute("data-radix-context-menu-content", "");
			editorContainer.appendChild(contextMenuContent);

			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// focusをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");

			// Context Menu Contentをクリック
			contextMenuContent.click();

			// textareaがフォーカスされていないことを確認
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("should not focus textarea when Radix UI popper content wrapper is clicked", () => {
			// Radix UI Popper Content Wrapper要素を作成
			const popperContentWrapper = document.createElement("div");
			popperContentWrapper.setAttribute(
				"data-radix-popper-content-wrapper",
				""
			);
			editorContainer.appendChild(popperContentWrapper);

			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// focusをスパイ
			const focusSpy = vi.spyOn(textarea, "focus");

			// Popper Content Wrapperをクリック
			popperContentWrapper.click();

			// textareaがフォーカスされていないことを確認
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it("should not move cursor when clicking during IME composition", () => {
			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// カーソルを途中に設定
			textarea.setSelectionRange(5, 5);

			// IME入力開始
			const compositionStartEvent = new CompositionEvent("compositionstart", {
				bubbles: true,
				cancelable: true,
			});
			textarea.dispatchEvent(compositionStartEvent);

			// setSelectionRangeをスパイ
			const setSelectionRangeSpy = vi.spyOn(textarea, "setSelectionRange");

			// エディタコンテナの境界を取得
			const rect = editorContainer.getBoundingClientRect();

			// IME入力中にクリックイベントが発火
			const clickEvent = new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
			});
			editorContainer.dispatchEvent(clickEvent);

			// setSelectionRangeが呼ばれていないことを確認（IME入力中は無視される）
			expect(setSelectionRangeSpy).not.toHaveBeenCalled();
		});

		it("should resume normal behavior after IME composition ends", () => {
			// フックをレンダリング
			renderHook(() => useClickExpansionTextarea({ editorRef, textareaRef }));

			// カーソルを途中に設定
			textarea.setSelectionRange(5, 5);

			// IME入力開始
			const compositionStartEvent = new CompositionEvent("compositionstart", {
				bubbles: true,
				cancelable: true,
			});
			textarea.dispatchEvent(compositionStartEvent);

			// IME入力終了
			const compositionEndEvent = new CompositionEvent("compositionend", {
				bubbles: true,
				cancelable: true,
			});
			textarea.dispatchEvent(compositionEndEvent);

			// setSelectionRangeをスパイ
			const setSelectionRangeSpy = vi.spyOn(textarea, "setSelectionRange");

			// エディタコンテナの境界を取得
			const rect = editorContainer.getBoundingClientRect();

			// IME入力終了後にクリック
			const clickEvent = new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
			});
			editorContainer.dispatchEvent(clickEvent);

			// カーソルが最後に移動していることを確認（IME入力終了後は正常動作）
			expect(setSelectionRangeSpy).toHaveBeenCalledWith(11, 11);
		});
	});
});
