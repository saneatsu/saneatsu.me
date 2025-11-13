import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImageUploadResult } from "../use-image-upload/use-image-upload";
import { usePasteImage } from "./use-paste-image";

describe("Unit Test", () => {
	describe("usePasteImage", () => {
		let editorRef: React.RefObject<HTMLDivElement | null>;
		let mockUploadImage: ReturnType<typeof vi.fn>;
		let mockOnChange: ReturnType<typeof vi.fn>;
		let mockTextarea: HTMLTextAreaElement;

		beforeEach(() => {
			// textareaのモックを作成
			mockTextarea = document.createElement("textarea");
			mockTextarea.value = "# Hello\n\nThis is content";
			mockTextarea.selectionStart = 17; // "This is " の直後
			mockTextarea.selectionEnd = 17;

			// editorRefのモックを作成
			const mockEditor = document.createElement("div");
			mockEditor.appendChild(mockTextarea);
			editorRef = { current: mockEditor };

			// uploadImageのモックを作成
			mockUploadImage = vi.fn();

			// onChangeのモックを作成
			mockOnChange = vi.fn();
		});

		it("should upload and insert image when pasting image", async () => {
			// Arrange
			const mockResult: ImageUploadResult = {
				imageId: "test-id",
				imageUrl: "https://example.com/image.png",
				markdown: "![test](https://example.com/image.png)",
			};
			mockUploadImage.mockResolvedValueOnce(mockResult);

			renderHook(() => usePasteImage(editorRef, mockUploadImage, mockOnChange));

			// Create clipboard data with image
			const file = new File(["test"], "test.png", { type: "image/png" });
			const clipboardData = {
				items: [
					{
						type: "image/png",
						getAsFile: () => file,
					},
				],
			};

			// Create paste event manually (ClipboardEvent is not available in Node.js)
			const pasteEvent = new Event("paste") as ClipboardEvent;
			Object.defineProperty(pasteEvent, "clipboardData", {
				value: clipboardData,
			});

			// Spy on preventDefault
			const preventDefaultSpy = vi.spyOn(pasteEvent, "preventDefault");

			// Act
			mockTextarea.dispatchEvent(pasteEvent);

			// Wait for async operations
			await vi.waitFor(() => {
				expect(mockUploadImage).toHaveBeenCalledWith(file);
			});

			// Assert
			expect(preventDefaultSpy).toHaveBeenCalled();
			expect(mockOnChange).toHaveBeenCalledWith(
				"# Hello\n\nThis is ![test](https://example.com/image.png)content"
			);
		});

		it("should not upload when pasting text", async () => {
			// Arrange
			renderHook(() => usePasteImage(editorRef, mockUploadImage, mockOnChange));

			// Create clipboard data with text only
			const clipboardData = {
				items: [
					{
						type: "text/plain",
						getAsFile: () => null,
					},
				],
			};

			// Create paste event manually
			const pasteEvent = new Event("paste") as ClipboardEvent;
			Object.defineProperty(pasteEvent, "clipboardData", {
				value: clipboardData,
			});

			// Act
			mockTextarea.dispatchEvent(pasteEvent);

			// Wait a bit to ensure no async operations are triggered
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Assert
			expect(mockUploadImage).not.toHaveBeenCalled();
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should prevent duplicate uploads when already uploading", async () => {
			// Arrange
			const mockResult: ImageUploadResult = {
				imageId: "test-id",
				imageUrl: "https://example.com/image.png",
				markdown: "![test](https://example.com/image.png)",
			};

			// Make first upload take some time
			mockUploadImage.mockImplementationOnce(
				() =>
					new Promise((resolve) => setTimeout(() => resolve(mockResult), 100))
			);

			renderHook(() => usePasteImage(editorRef, mockUploadImage, mockOnChange));

			const file = new File(["test"], "test.png", { type: "image/png" });
			const clipboardData = {
				items: [
					{
						type: "image/png",
						getAsFile: () => file,
					},
				],
			};

			// Act - dispatch first paste event
			const pasteEvent1 = new Event("paste") as ClipboardEvent;
			Object.defineProperty(pasteEvent1, "clipboardData", {
				value: clipboardData,
			});
			mockTextarea.dispatchEvent(pasteEvent1);

			// Immediately dispatch second paste event
			const pasteEvent2 = new Event("paste") as ClipboardEvent;
			Object.defineProperty(pasteEvent2, "clipboardData", {
				value: clipboardData,
			});
			mockTextarea.dispatchEvent(pasteEvent2);

			// Wait for uploads to complete
			await vi.waitFor(
				() => {
					expect(mockUploadImage).toHaveBeenCalledTimes(1);
				},
				{ timeout: 200 }
			);

			// Assert - uploadImage should only be called once
			expect(mockUploadImage).toHaveBeenCalledTimes(1);
		});

		it("should not update editor when upload fails", async () => {
			// Arrange
			mockUploadImage.mockResolvedValueOnce(null);

			renderHook(() => usePasteImage(editorRef, mockUploadImage, mockOnChange));

			const file = new File(["test"], "test.png", { type: "image/png" });
			const clipboardData = {
				items: [
					{
						type: "image/png",
						getAsFile: () => file,
					},
				],
			};

			const pasteEvent = new Event("paste") as ClipboardEvent;
			Object.defineProperty(pasteEvent, "clipboardData", {
				value: clipboardData,
			});

			// Act
			mockTextarea.dispatchEvent(pasteEvent);

			await vi.waitFor(() => {
				expect(mockUploadImage).toHaveBeenCalled();
			});

			// Assert
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should handle missing clipboard items", () => {
			// Arrange
			renderHook(() => usePasteImage(editorRef, mockUploadImage, mockOnChange));

			// Create paste event without clipboardData
			const pasteEvent = new Event("paste") as ClipboardEvent;

			// Act
			mockTextarea.dispatchEvent(pasteEvent);

			// Assert
			expect(mockUploadImage).not.toHaveBeenCalled();
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should cleanup event listener on unmount", () => {
			// Arrange
			const removeEventListenerSpy = vi.spyOn(
				mockTextarea,
				"removeEventListener"
			);

			// Act
			const { unmount } = renderHook(() =>
				usePasteImage(editorRef, mockUploadImage, mockOnChange)
			);

			unmount();

			// Assert
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"paste",
				expect.any(Function)
			);
		});
	});
});
