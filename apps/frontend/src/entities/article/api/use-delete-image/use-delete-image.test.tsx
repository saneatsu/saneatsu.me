import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteImage } from "./use-delete-image";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// テスト用のQueryClientプロバイダー
function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useDeleteImage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("正常系", () => {
		it("画像を削除してメッセージを返す", async () => {
			// Arrange: モックレスポンスを設定
			const mockResponse = {
				message: "画像が正常に削除されました",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const testImageId = "test-image-id-123";

			// Act: フックを実行
			const { result } = renderHook(() => useDeleteImage(), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				await result.current.mutateAsync({ imageId: testImageId });
			});

			// Assert: 正しいパラメータでfetchが呼ばれたことを確認
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				`${process.env.NEXT_PUBLIC_API_URL}/api/images/${testImageId}`,
				expect.objectContaining({
					method: "DELETE",
				})
			);

			// Assert: 正しいレスポンスが返ることを確認
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
				expect(result.current.data).toEqual(mockResponse);
			});
		});
	});

	describe("異常系", () => {
		it("サーバーがエラーレスポンスを返した場合、エラーをスローする", async () => {
			// Arrange: エラーレスポンスを設定
			const mockErrorResponse = {
				error: {
					code: "IMAGE_NOT_FOUND",
					message: "画像が見つかりません",
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => mockErrorResponse,
			});

			const testImageId = "test-image-id-123";

			// Act: フックを実行
			const { result } = renderHook(() => useDeleteImage(), {
				wrapper: createWrapper(),
			});

			// Assert: エラーがスローされることを確認
			await act(async () => {
				try {
					await result.current.mutateAsync({ imageId: testImageId });
				} catch (error) {
					expect(error).toEqual(mockErrorResponse);
				}
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
				expect(result.current.error).toEqual(mockErrorResponse);
			});
		});

		it("ネットワークリクエストが失敗した場合、エラーをスローする", async () => {
			// Arrange: ネットワークエラーを設定
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const testImageId = "test-image-id-123";

			// Act: フックを実行
			const { result } = renderHook(() => useDeleteImage(), {
				wrapper: createWrapper(),
			});

			// Assert: エラーがスローされることを確認
			await act(async () => {
				try {
					await result.current.mutateAsync({ imageId: testImageId });
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toBe("Network error");
				}
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});
		});
	});
});
