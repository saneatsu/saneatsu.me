import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
	ArticleCreateRequest,
	ArticleCreateResponse,
} from "@/shared/model";

import { useCreate } from "./use-create";

// useHonoClientのモック
const { mockPost } = vi.hoisted(() => ({
	mockPost: vi.fn(),
}));

vi.mock("@/shared/lib", () => ({
	useHonoClient: () => ({
		api: {
			articles: {
				$post: mockPost,
			},
		},
	}),
	queryKeys: {
		article: {
			all: () => ["articles"],
		},
	},
	extractErrorMessage: vi.fn((error: unknown, fallback: string) => {
		// エラーオブジェクトから適切にメッセージを抽出
		if (error && typeof error === "object" && "error" in error) {
			const apiError = error.error;
			if (
				typeof apiError === "object" &&
				apiError !== null &&
				"message" in apiError
			) {
				return (apiError as { message: string }).message;
			}
		}
		return fallback;
	}),
}));

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

describe("useCreate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("正常系", () => {
		it("cfImageIdなしで記事を作成する", async () => {
			// Arrange: モックレスポンスを設定
			const mockResponseData: ArticleCreateResponse = {
				data: {
					id: 1,
					slug: "test-article",
					cfImageId: null,
					status: "draft",
					publishedAt: null,
					updatedAt: "2024-01-01T00:00:00Z",
					title: "テスト記事",
					content: "テスト本文",
					viewCount: 0,
					tags: [],
				},
				message: "記事が正常に作成されました",
			};

			mockPost.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponseData,
			});

			const testData: ArticleCreateRequest = {
				title: "テスト記事",
				slug: "test-article",
				content: "テスト本文",
				status: "draft",
			};

			// Act: フックを実行
			const { result } = renderHook(() => useCreate(), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				await result.current.mutateAsync(testData);
			});

			// Assert: 正しいパラメータでhonoClientが呼ばれたことを確認
			expect(mockPost).toHaveBeenCalledTimes(1);
			expect(mockPost).toHaveBeenCalledWith({
				json: {
					title: testData.title,
					slug: testData.slug,
					content: testData.content,
					status: testData.status,
					publishedAt: undefined,
					tagIds: [],
					cfImageId: undefined,
				},
			});

			// Assert: 正しいレスポンスが返ることを確認
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
				expect(result.current.data).toEqual(mockResponseData);
			});
		});

		it("cfImageIdありで記事を作成する", async () => {
			// Arrange: モックレスポンスを設定
			const mockResponseData: ArticleCreateResponse = {
				data: {
					id: 1,
					slug: "test-article",
					cfImageId: "test-image-id-123",
					status: "draft",
					publishedAt: null,
					updatedAt: "2024-01-01T00:00:00Z",
					title: "テスト記事",
					content: "テスト本文",
					viewCount: 0,
					tags: [],
				},
				message: "記事が正常に作成されました",
			};

			mockPost.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponseData,
			});

			const testData: ArticleCreateRequest = {
				title: "テスト記事",
				slug: "test-article",
				content: "テスト本文",
				status: "draft",
				cfImageId: "test-image-id-123",
			};

			// Act: フックを実行
			const { result } = renderHook(() => useCreate(), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				await result.current.mutateAsync(testData);
			});

			// Assert: 正しいパラメータでhonoClientが呼ばれたことを確認（cfImageIdを含む）
			expect(mockPost).toHaveBeenCalledTimes(1);
			expect(mockPost).toHaveBeenCalledWith({
				json: {
					title: testData.title,
					slug: testData.slug,
					content: testData.content,
					status: testData.status,
					publishedAt: undefined,
					tagIds: [],
					cfImageId: "test-image-id-123",
				},
			});

			// Assert: 正しいレスポンスが返ることを確認
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
				expect(result.current.data).toEqual(mockResponseData);
			});
		});
	});

	describe("異常系", () => {
		it("サーバーがエラーレスポンスを返した場合、エラーをスローする", async () => {
			// Arrange: エラーレスポンスを設定
			const mockErrorResponse = {
				error: {
					code: "SLUG_ALREADY_EXISTS",
					message: "このスラッグは既に使用されています",
				},
			};

			mockPost.mockResolvedValueOnce({
				ok: false,
				json: async () => mockErrorResponse,
			});

			const testData: ArticleCreateRequest = {
				title: "テスト記事",
				slug: "test-article",
				content: "テスト本文",
				status: "draft",
			};

			// Act: フックを実行
			const { result } = renderHook(() => useCreate(), {
				wrapper: createWrapper(),
			});

			// Assert: エラーがスローされることを確認
			await act(async () => {
				try {
					await result.current.mutateAsync(testData);
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toBe(
						"このスラッグは既に使用されています"
					);
				}
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});
		});
	});
});
