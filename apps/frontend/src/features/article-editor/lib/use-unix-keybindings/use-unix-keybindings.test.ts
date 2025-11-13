/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useUnixKeybindings } from "./use-unix-keybindings";

describe("useUnixKeybindings", () => {
	describe("Unit Test", () => {
		let textarea: HTMLTextAreaElement;
		let textareaRef: React.RefObject<HTMLTextAreaElement | null>;

		beforeEach(() => {
			// textareaを作成
			textarea = document.createElement("textarea");
			document.body.appendChild(textarea);

			// ref オブジェクトを作成
			textareaRef = { current: textarea };
		});

		it("should select from cursor to end of line when Shift+Ctrl+E is pressed", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを "Hello" の後（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Shift+Ctrl+E を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "e",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルから行末まで選択されていることを確認
			expect(textarea.selectionStart).toBe(5);
			expect(textarea.selectionEnd).toBe(11); // "Hello World" の長さ
		});

		it("should select from beginning of line to cursor when Shift+Ctrl+A is pressed", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを " World" の前（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Shift+Ctrl+A を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "a",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 行頭からカーソルまで選択されていることを確認
			expect(textarea.selectionStart).toBe(0);
			expect(textarea.selectionEnd).toBe(5);
		});

		it("should extend selection to end of line when Shift+Ctrl+E is pressed with existing selection", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// "ello" を選択（位置1から5まで）
			textarea.setSelectionRange(1, 5);

			// Shift+Ctrl+E を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "e",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 選択範囲が行末まで拡張されていることを確認
			expect(textarea.selectionStart).toBe(1);
			expect(textarea.selectionEnd).toBe(11);
		});

		it("should extend selection to beginning of line when Shift+Ctrl+A is pressed with existing selection", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// "ello" を選択（位置1から5まで）
			textarea.setSelectionRange(1, 5);

			// Shift+Ctrl+A を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "a",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 選択範囲が行頭まで拡張されていることを確認
			expect(textarea.selectionStart).toBe(0);
			expect(textarea.selectionEnd).toBe(5);
		});

		it("should move cursor to end of line when Ctrl+E is pressed without Shift", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを "Hello" の後（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Ctrl+E を押す（Shiftなし）
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "e",
				ctrlKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルが行末に移動していることを確認（選択なし）
			expect(textarea.selectionStart).toBe(11);
			expect(textarea.selectionEnd).toBe(11);
		});

		it("should move cursor to beginning of line when Ctrl+A is pressed without Shift", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを " World" の前（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Ctrl+A を押す（Shiftなし）
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "a",
				ctrlKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルが行頭に移動していることを確認（選択なし）
			expect(textarea.selectionStart).toBe(0);
			expect(textarea.selectionEnd).toBe(0);
		});

		it("should select to end of current line in multiline text when Shift+Ctrl+E is pressed", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// 複数行のテキストを設定
			textarea.value = "First line\nSecond line\nThird line";
			// 2行目の "Second" の後（位置17）に配置
			textarea.setSelectionRange(17, 17);

			// Shift+Ctrl+E を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "e",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルから現在行の行末まで選択されていることを確認
			expect(textarea.selectionStart).toBe(17);
			expect(textarea.selectionEnd).toBe(22); // "Second line" の終わり
		});

		it("should select to beginning of current line in multiline text when Shift+Ctrl+A is pressed", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// 複数行のテキストを設定
			textarea.value = "First line\nSecond line\nThird line";
			// 2行目の " line" の前（位置17）に配置
			textarea.setSelectionRange(17, 17);

			// Shift+Ctrl+A を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "a",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 現在行の行頭からカーソルまで選択されていることを確認
			expect(textarea.selectionStart).toBe(11); // 2行目の開始位置
			expect(textarea.selectionEnd).toBe(17);
		});

		it("should select one character to the left when Shift+Ctrl+B is pressed", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを " World" の前（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Shift+Ctrl+B を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "b",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルから左に1文字選択されていることを確認
			expect(textarea.selectionStart).toBe(4);
			expect(textarea.selectionEnd).toBe(5);
		});

		it("should select one character to the right when Shift+Ctrl+F is pressed", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを " World" の前（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Shift+Ctrl+F を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "f",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルから右に1文字選択されていることを確認
			expect(textarea.selectionStart).toBe(5);
			expect(textarea.selectionEnd).toBe(6);
		});

		it("should extend selection to the left when Shift+Ctrl+B is pressed with existing selection", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// "lo" を選択（位置3から5まで）
			textarea.setSelectionRange(3, 5);

			// Shift+Ctrl+B を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "b",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 選択範囲が左に1文字拡張されていることを確認
			expect(textarea.selectionStart).toBe(2);
			expect(textarea.selectionEnd).toBe(5);
		});

		it("should extend selection to the right when Shift+Ctrl+F is pressed with existing selection", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// "lo" を選択（位置3から5まで）
			textarea.setSelectionRange(3, 5);

			// Shift+Ctrl+F を押す
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "f",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// 選択範囲が右に1文字拡張されていることを確認
			expect(textarea.selectionStart).toBe(3);
			expect(textarea.selectionEnd).toBe(6);
		});

		it("should move cursor one character to the left when Ctrl+B is pressed without Shift", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを " World" の前（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Ctrl+B を押す（Shiftなし）
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "b",
				ctrlKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルが1文字左に移動していることを確認（選択なし）
			expect(textarea.selectionStart).toBe(4);
			expect(textarea.selectionEnd).toBe(4);
		});

		it("should move cursor one character to the right when Ctrl+F is pressed without Shift", () => {
			// フックをレンダリング
			renderHook(() => useUnixKeybindings({ textareaRef }));

			// textareaにフォーカス
			textarea.focus();

			// テキストを設定
			textarea.value = "Hello World";
			// カーソルを " World" の前（位置5）に配置
			textarea.setSelectionRange(5, 5);

			// Ctrl+F を押す（Shiftなし）
			const keydownEvent = new KeyboardEvent("keydown", {
				key: "f",
				ctrlKey: true,
				bubbles: true,
				cancelable: true,
			});
			window.dispatchEvent(keydownEvent);

			// カーソルが1文字右に移動していることを確認（選択なし）
			expect(textarea.selectionStart).toBe(6);
			expect(textarea.selectionEnd).toBe(6);
		});
	});
});
