/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBracketCompletion } from "./use-bracket-completion";

describe("useBracketCompletion", () => {
	describe("Unit Test", () => {
		let textarea: HTMLTextAreaElement;
		let textareaRef: React.RefObject<HTMLTextAreaElement | null>;
		let mockSetMarkdownValue: ReturnType<typeof vi.fn>;
		let mockSetValue: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			// textareaを作成
			textarea = document.createElement("textarea");
			document.body.appendChild(textarea);

			// ref オブジェクトを作成
			textareaRef = { current: textarea };

			// モック関数を作成
			mockSetMarkdownValue = vi.fn();
			mockSetValue = vi.fn();
		});

		it("should not auto-complete brackets during IME composition", () => {
			// フックをレンダリング
			renderHook(() =>
				useBracketCompletion({
					textareaRef,
					setMarkdownValue: mockSetMarkdownValue,
					setValue: mockSetValue,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// IME入力開始
			const compositionStartEvent = new CompositionEvent("compositionstart", {
				bubbles: true,
				cancelable: true,
			});
			textarea.dispatchEvent(compositionStartEvent);

			// IME入力中に [ キーを押す（「を入力しようとしている）
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "[",
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 自動補完が実行されていないことを確認
			expect(mockSetMarkdownValue).not.toHaveBeenCalled();
			expect(mockSetValue).not.toHaveBeenCalled();
		});

		it("should resume normal bracket completion after IME composition ends", () => {
			// フックをレンダリング
			renderHook(() =>
				useBracketCompletion({
					textareaRef,
					setMarkdownValue: mockSetMarkdownValue,
					setValue: mockSetValue,
				})
			);

			// textareaにフォーカス
			textarea.focus();

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

			// IME入力終了後に [ キーを押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "[",
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 自動補完が実行されることを確認
			expect(mockSetMarkdownValue).toHaveBeenCalled();
			expect(mockSetValue).toHaveBeenCalled();
		});

		it("should auto-complete brackets when not in IME composition", () => {
			// フックをレンダリング
			renderHook(() =>
				useBracketCompletion({
					textareaRef,
					setMarkdownValue: mockSetMarkdownValue,
					setValue: mockSetValue,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// 通常の [ キー入力
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "[",
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 自動補完が実行されることを確認
			expect(mockSetMarkdownValue).toHaveBeenCalled();
			expect(mockSetValue).toHaveBeenCalled();
		});

		it("should not auto-complete brackets when key is 'Process'", () => {
			// フックをレンダリング
			renderHook(() =>
				useBracketCompletion({
					textareaRef,
					setMarkdownValue: mockSetMarkdownValue,
					setValue: mockSetValue,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// IME入力中（e.key === 'Process'）
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "Process",
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 自動補完が実行されていないことを確認
			expect(mockSetMarkdownValue).not.toHaveBeenCalled();
			expect(mockSetValue).not.toHaveBeenCalled();
		});

		it("should not auto-complete brackets when keyCode is 229", () => {
			// フックをレンダリング
			renderHook(() =>
				useBracketCompletion({
					textareaRef,
					setMarkdownValue: mockSetMarkdownValue,
					setValue: mockSetValue,
				})
			);

			// textareaにフォーカス
			textarea.focus();

			// IME入力中（e.keyCode === 229）
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "[",
				keyCode: 229,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 自動補完が実行されていないことを確認
			expect(mockSetMarkdownValue).not.toHaveBeenCalled();
			expect(mockSetValue).not.toHaveBeenCalled();
		});
	});
});
