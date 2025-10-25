import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useImageUpload } from "./use-image-upload";

// honoClientのモック
const { mockPost } = vi.hoisted(() => ({
	mockPost: vi.fn(),
}));

vi.mock("@/shared/lib", () => ({
	honoClient: {
		api: {
			images: {
				$post: mockPost,
			},
		},
	},
}));

// sonnerのモック
const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
	mockToastSuccess: vi.fn(),
	mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: mockToastSuccess,
		error: mockToastError,
	},
}));

describe("Unit Test", () => {
	describe("useImageUpload", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should initialize with correct default values", () => {
			const { result } = renderHook(() => useImageUpload());

			expect(result.current.isUploading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(typeof result.current.uploadImage).toBe("function");
		});

		it("should upload image successfully and return ImageUploadResult", async () => {
			// Arrange
			const mockFile = new File(["test"], "test-image.png", {
				type: "image/png",
			});
			const mockResponse = {
				ok: true,
				json: async () => ({
					imageId: "test-id",
					imageUrl: "https://example.com/image.png",
					message: "Upload successful",
				}),
			};
			mockPost.mockResolvedValueOnce(mockResponse);

			// Act
			const { result } = renderHook(() => useImageUpload());
			const uploadResult = await result.current.uploadImage(mockFile);

			// Assert - result should contain correct data
			expect(uploadResult).toEqual({
				imageId: "test-id",
				imageUrl: "https://example.com/image.png",
				markdown: "![test-image](https://example.com/image.png)",
			});

			// Assert - success toast should be called
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"画像をアップロードしました"
			);

			// Assert - isUploading should be false after upload
			expect(result.current.isUploading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it("should generate alt text from filename without extension", async () => {
			// Arrange
			const mockFile = new File(["test"], "my-awesome-screenshot.jpg", {
				type: "image/jpeg",
			});
			const mockResponse = {
				ok: true,
				json: async () => ({
					imageId: "test-id",
					imageUrl: "https://example.com/image.jpg",
					message: "Upload successful",
				}),
			};
			mockPost.mockResolvedValueOnce(mockResponse);

			// Act
			const { result } = renderHook(() => useImageUpload());
			const uploadResult = await result.current.uploadImage(mockFile);

			// Assert - alt text should not include extension
			expect(uploadResult?.markdown).toBe(
				"![my-awesome-screenshot](https://example.com/image.jpg)"
			);
		});

		it("should handle API error response", async () => {
			// Arrange
			const mockFile = new File(["test"], "test.png", { type: "image/png" });
			const mockErrorResponse = {
				ok: false,
				json: async () => ({
					error: {
						code: "UPLOAD_FAILED",
						message: "ファイルのアップロードに失敗しました",
					},
				}),
			};
			mockPost.mockResolvedValueOnce(mockErrorResponse);

			// Act
			const { result } = renderHook(() => useImageUpload());
			const uploadResult = await result.current.uploadImage(mockFile);

			// Assert
			expect(uploadResult).toBeNull();
			expect(mockToastError).toHaveBeenCalledWith(
				"ファイルのアップロードに失敗しました"
			);

			await waitFor(() => {
				expect(result.current.error).toBe(
					"ファイルのアップロードに失敗しました"
				);
				expect(result.current.isUploading).toBe(false);
			});
		});

		it("should handle network error", async () => {
			// Arrange
			const mockFile = new File(["test"], "test.png", { type: "image/png" });
			mockPost.mockRejectedValueOnce(new Error("Network error"));

			// Act
			const { result } = renderHook(() => useImageUpload());
			const uploadResult = await result.current.uploadImage(mockFile);

			// Assert
			expect(uploadResult).toBeNull();
			expect(mockToastError).toHaveBeenCalledWith("Network error");

			await waitFor(() => {
				expect(result.current.error).toBe("Network error");
				expect(result.current.isUploading).toBe(false);
			});
		});

		it("should handle unknown error", async () => {
			// Arrange
			const mockFile = new File(["test"], "test.png", { type: "image/png" });
			mockPost.mockRejectedValueOnce("Unknown error");

			// Act
			const { result } = renderHook(() => useImageUpload());
			const uploadResult = await result.current.uploadImage(mockFile);

			// Assert
			expect(uploadResult).toBeNull();
			expect(mockToastError).toHaveBeenCalledWith(
				"画像のアップロードに失敗しました"
			);

			await waitFor(() => {
				expect(result.current.error).toBe("画像のアップロードに失敗しました");
				expect(result.current.isUploading).toBe(false);
			});
		});

		it("should call API with correct form data", async () => {
			// Arrange
			const mockFile = new File(["test"], "test.png", { type: "image/png" });
			const mockResponse = {
				ok: true,
				json: async () => ({
					imageId: "test-id",
					imageUrl: "https://example.com/image.png",
					message: "Upload successful",
				}),
			};
			mockPost.mockResolvedValueOnce(mockResponse);

			// Act
			const { result } = renderHook(() => useImageUpload());
			await result.current.uploadImage(mockFile);

			// Assert - API should be called with form object containing the file
			expect(mockPost).toHaveBeenCalledTimes(1);
			const callArg = mockPost.mock.calls[0][0];
			expect(callArg.form).toEqual({ file: mockFile });
		});
	});
});
