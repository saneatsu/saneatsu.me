import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageUploadResult } from "../use-image-upload/use-image-upload";
import { useDropImage } from "./use-drop-image";

describe("Unit Test", () => {
	describe("useDropImage", () => {
		let editorRef: React.RefObject<HTMLDivElement>;
		let mockUploadImage: ReturnType<typeof vi.fn>;
		let mockOnChange: ReturnType<typeof vi.fn>;
		let mockTextarea: HTMLTextAreaElement;
		let mockEditor: HTMLDivElement;

		beforeEach(() => {
			// textareaのモックを作成
			mockTextarea = document.createElement("textarea");
			mockTextarea.value = "# Hello\n\nThis is content";
			mockTextarea.selectionStart = 17; // "This is " の直後
			mockTextarea.selectionEnd = 17;

			// editorRefのモックを作成
			mockEditor = document.createElement("div");
			mockEditor.appendChild(mockTextarea);
			editorRef = { current: mockEditor };

			// uploadImageのモックを作成
			mockUploadImage = vi.fn();

			// onChangeのモックを作成
			mockOnChange = vi.fn();
		});

		it("should upload and insert image when dropping image", async () => {
			// Arrange
			const mockResult: ImageUploadResult = {
				imageId: "test-id",
				imageUrl: "https://example.com/image.png",
				markdown: "![test](https://example.com/image.png)",
			};
			mockUploadImage.mockResolvedValueOnce(mockResult);

			renderHook(() => useDropImage(editorRef, mockUploadImage, mockOnChange));

			// Create drag data with image
			const file = new File(["test"], "test.png", { type: "image/png" });
			const dataTransfer = {
				files: [file],
			};

			// Create drop event manually (DragEvent is not available in Node.js)
			const dropEvent = new Event("drop") as DragEvent;
			Object.defineProperty(dropEvent, "dataTransfer", {
				value: dataTransfer,
			});

			// Spy on preventDefault and stopPropagation
			const preventDefaultSpy = vi.spyOn(dropEvent, "preventDefault");
			const stopPropagationSpy = vi.spyOn(dropEvent, "stopPropagation");

			// Act
			mockEditor.dispatchEvent(dropEvent);

			// Wait for async operations
			await vi.waitFor(() => {
				expect(mockUploadImage).toHaveBeenCalledWith(file);
			});

			// Assert
			expect(preventDefaultSpy).toHaveBeenCalled();
			expect(stopPropagationSpy).toHaveBeenCalled();
			expect(mockOnChange).toHaveBeenCalledWith(
				"# Hello\n\nThis is ![test](https://example.com/image.png)content"
			);
		});

		it("should prevent default on dragover", () => {
			// Arrange
			renderHook(() => useDropImage(editorRef, mockUploadImage, mockOnChange));

			// Create dragover event
			const dragoverEvent = new Event("dragover") as DragEvent;

			// Spy on preventDefault and stopPropagation
			const preventDefaultSpy = vi.spyOn(dragoverEvent, "preventDefault");
			const stopPropagationSpy = vi.spyOn(dragoverEvent, "stopPropagation");

			// Act
			mockEditor.dispatchEvent(dragoverEvent);

			// Assert
			expect(preventDefaultSpy).toHaveBeenCalled();
			expect(stopPropagationSpy).toHaveBeenCalled();
		});

		it("should not upload when dropping non-image files", async () => {
			// Arrange
			renderHook(() => useDropImage(editorRef, mockUploadImage, mockOnChange));

			// Create drag data with non-image file
			const file = new File(["test"], "test.txt", { type: "text/plain" });
			const dataTransfer = {
				files: [file],
			};

			// Create drop event
			const dropEvent = new Event("drop") as DragEvent;
			Object.defineProperty(dropEvent, "dataTransfer", {
				value: dataTransfer,
			});

			// Act
			mockEditor.dispatchEvent(dropEvent);

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

			renderHook(() => useDropImage(editorRef, mockUploadImage, mockOnChange));

			const file = new File(["test"], "test.png", { type: "image/png" });
			const dataTransfer = {
				files: [file],
			};

			// Act - dispatch first drop event
			const dropEvent1 = new Event("drop") as DragEvent;
			Object.defineProperty(dropEvent1, "dataTransfer", {
				value: dataTransfer,
			});
			mockEditor.dispatchEvent(dropEvent1);

			// Immediately dispatch second drop event
			const dropEvent2 = new Event("drop") as DragEvent;
			Object.defineProperty(dropEvent2, "dataTransfer", {
				value: dataTransfer,
			});
			mockEditor.dispatchEvent(dropEvent2);

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

			renderHook(() => useDropImage(editorRef, mockUploadImage, mockOnChange));

			const file = new File(["test"], "test.png", { type: "image/png" });
			const dataTransfer = {
				files: [file],
			};

			const dropEvent = new Event("drop") as DragEvent;
			Object.defineProperty(dropEvent, "dataTransfer", {
				value: dataTransfer,
			});

			// Act
			mockEditor.dispatchEvent(dropEvent);

			await vi.waitFor(() => {
				expect(mockUploadImage).toHaveBeenCalled();
			});

			// Assert
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should handle missing dataTransfer", () => {
			// Arrange
			renderHook(() => useDropImage(editorRef, mockUploadImage, mockOnChange));

			// Create drop event without dataTransfer
			const dropEvent = new Event("drop") as DragEvent;

			// Act
			mockEditor.dispatchEvent(dropEvent);

			// Assert
			expect(mockUploadImage).not.toHaveBeenCalled();
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should cleanup event listeners on unmount", () => {
			// Arrange
			const removeEventListenerSpy = vi.spyOn(
				mockEditor,
				"removeEventListener"
			);

			// Act
			const { unmount } = renderHook(() =>
				useDropImage(editorRef, mockUploadImage, mockOnChange)
			);

			unmount();

			// Assert
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"dragover",
				expect.any(Function)
			);
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"drop",
				expect.any(Function)
			);
		});
	});
});
