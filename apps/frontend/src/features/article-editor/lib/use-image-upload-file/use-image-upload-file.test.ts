import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ImageUploadResult } from "../use-image-upload/use-image-upload";
import { useImageUploadFile } from "./use-image-upload-file";

describe("Unit Test", () => {
	describe("useImageUploadFile", () => {
		let textareaRef: React.RefObject<HTMLTextAreaElement>;
		let mockUploadImage: ReturnType<typeof vi.fn>;
		let mockOnChange: ReturnType<typeof vi.fn>;
		let mockTextarea: HTMLTextAreaElement;
		let mockFileInput: HTMLInputElement;

		beforeEach(() => {
			// textareaのモックを作成
			mockTextarea = document.createElement("textarea");
			mockTextarea.value = "# Hello\n\nThis is content";
			mockTextarea.selectionStart = 17; // "This is " の直後
			mockTextarea.selectionEnd = 17;

			// textareaRefのモックを作成
			textareaRef = { current: mockTextarea };

			// uploadImageのモックを作成
			mockUploadImage = vi.fn();

			// onChangeのモックを作成
			mockOnChange = vi.fn();

			// createElementのモックを作成してfile inputを返すようにする
			mockFileInput = document.createElement("input");
			mockFileInput.type = "file";
			mockFileInput.accept = "image/*";

			vi.spyOn(document, "createElement").mockReturnValue(
				mockFileInput as unknown as HTMLElement
			);
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should upload and insert image when file is selected", async () => {
			// Arrange
			const mockResult: ImageUploadResult = {
				imageId: "test-id",
				imageUrl: "https://example.com/image.png",
				markdown: "![test](https://example.com/image.png)",
			};
			mockUploadImage.mockResolvedValueOnce(mockResult);

			const { result } = renderHook(() =>
				useImageUploadFile(textareaRef, mockUploadImage, mockOnChange)
			);

			// Create mock file
			const file = new File(["test"], "test.png", { type: "image/png" });
			Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

			// Act
			result.current.openFileDialog();

			// Simulate file selection
			Object.defineProperty(mockFileInput, "files", {
				value: [file],
				writable: false,
			});

			// Trigger change event
			const changeEvent = new Event("change", { bubbles: true });
			mockFileInput.dispatchEvent(changeEvent);

			// Wait for upload to complete
			await waitFor(() => {
				expect(mockUploadImage).toHaveBeenCalledWith(file);
			});

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith(
				"# Hello\n\nThis is ![test](https://example.com/image.png)content"
			);
		});

		it("should not upload when file size exceeds 10MB", async () => {
			// Arrange
			const { result } = renderHook(() =>
				useImageUploadFile(textareaRef, mockUploadImage, mockOnChange)
			);

			// Create large file (11MB)
			const file = new File(["test"], "test.png", { type: "image/png" });
			Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });

			// Act
			result.current.openFileDialog();

			Object.defineProperty(mockFileInput, "files", {
				value: [file],
				writable: false,
			});

			const changeEvent = new Event("change", { bubbles: true });
			mockFileInput.dispatchEvent(changeEvent);

			// Wait a bit to ensure no async operations are triggered
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Assert
			expect(mockUploadImage).not.toHaveBeenCalled();
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should not upload when file is not an image", async () => {
			// Arrange
			const { result } = renderHook(() =>
				useImageUploadFile(textareaRef, mockUploadImage, mockOnChange)
			);

			// Create non-image file
			const file = new File(["test"], "test.txt", { type: "text/plain" });
			Object.defineProperty(file, "size", { value: 1024 });

			// Act
			result.current.openFileDialog();

			Object.defineProperty(mockFileInput, "files", {
				value: [file],
				writable: false,
			});

			const changeEvent = new Event("change", { bubbles: true });
			mockFileInput.dispatchEvent(changeEvent);

			// Wait a bit to ensure no async operations are triggered
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Assert
			expect(mockUploadImage).not.toHaveBeenCalled();
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should not update editor when upload fails", async () => {
			// Arrange
			mockUploadImage.mockResolvedValueOnce(null);

			const { result } = renderHook(() =>
				useImageUploadFile(textareaRef, mockUploadImage, mockOnChange)
			);

			const file = new File(["test"], "test.png", { type: "image/png" });
			Object.defineProperty(file, "size", { value: 1024 * 1024 });

			// Act
			result.current.openFileDialog();

			Object.defineProperty(mockFileInput, "files", {
				value: [file],
				writable: false,
			});

			const changeEvent = new Event("change", { bubbles: true });
			mockFileInput.dispatchEvent(changeEvent);

			await waitFor(() => {
				expect(mockUploadImage).toHaveBeenCalled();
			});

			// Assert
			expect(mockOnChange).not.toHaveBeenCalled();
		});

		it("should handle no file selected", () => {
			// Arrange
			const { result } = renderHook(() =>
				useImageUploadFile(textareaRef, mockUploadImage, mockOnChange)
			);

			// Act
			result.current.openFileDialog();

			Object.defineProperty(mockFileInput, "files", {
				value: [],
				writable: false,
			});

			const changeEvent = new Event("change", { bubbles: true });
			mockFileInput.dispatchEvent(changeEvent);

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

			const { result } = renderHook(() =>
				useImageUploadFile(textareaRef, mockUploadImage, mockOnChange)
			);

			const file = new File(["test"], "test.png", { type: "image/png" });
			Object.defineProperty(file, "size", { value: 1024 * 1024 });

			// Act - trigger first upload
			result.current.openFileDialog();

			Object.defineProperty(mockFileInput, "files", {
				value: [file],
				writable: false,
			});

			const changeEvent1 = new Event("change", { bubbles: true });
			mockFileInput.dispatchEvent(changeEvent1);

			// Immediately trigger second upload
			const changeEvent2 = new Event("change", { bubbles: true });
			mockFileInput.dispatchEvent(changeEvent2);

			// Wait for uploads to complete
			await waitFor(
				() => {
					expect(mockUploadImage).toHaveBeenCalledTimes(1);
				},
				{ timeout: 200 }
			);

			// Assert - uploadImage should only be called once
			expect(mockUploadImage).toHaveBeenCalledTimes(1);
		});
	});
});
