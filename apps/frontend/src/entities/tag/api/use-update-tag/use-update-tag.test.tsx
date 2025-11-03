import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateTag } from "./use-update-tag";

// useHonoClient のモック
const { mockPut } = vi.hoisted(() => ({
	mockPut: vi.fn(),
}));

vi.mock("@/shared/lib", () => ({
	useHonoClient: () => ({
		api: {
			tags: {
				":id": {
					$put: mockPut,
				},
			},
		},
	}),
	queryKeys: {
		tag: {
			all: () => ["tags"],
		},
	},
	extractErrorMessage: vi.fn(),
}));

/**
 * テスト用のQueryClientを作成
 */
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

/**
 * React Query のプロバイダーでラップしたフックをレンダリング
 */
const renderHookWithQueryClient = <T,>(hook: () => T) => {
	const queryClient = createTestQueryClient();
	return renderHook(hook, {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	});
};

describe("Unit Test", () => {
	describe("useUpdateTag", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should send name, enName, and slug when updating a tag", async () => {
			// テストデータ
			const updateData = {
				id: 1,
				name: "思考の整理",
				enName: "thinking",
				slug: "thinking",
			};

			// モックレスポンス
			const mockResponse = {
				ok: true,
				json: async () => ({
					data: {
						id: 1,
						slug: "thinking",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-02T00:00:00.000Z",
					},
					message: "タグが正常に更新されました",
				}),
			};

			mockPut.mockResolvedValue(mockResponse);

			// フックをレンダリング
			const { result } = renderHookWithQueryClient(() => useUpdateTag());

			// mutateAsync を実行
			await result.current.mutateAsync(updateData);

			// モックが正しいパラメータで呼ばれたことを確認
			await waitFor(() => {
				expect(mockPut).toHaveBeenCalledWith({
					param: { id: "1" },
					json: {
						name: "思考の整理",
						enName: "thinking",
						slug: "thinking",
					},
				});
			});
		});

		it("should send name and slug without enName when enName is undefined", async () => {
			// テストデータ（enName なし）
			const updateData = {
				id: 2,
				name: "新しいタグ",
				slug: "new-tag",
			};

			// モックレスポンス
			const mockResponse = {
				ok: true,
				json: async () => ({
					data: {
						id: 2,
						slug: "new-tag",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-02T00:00:00.000Z",
					},
					message: "タグが正常に更新されました",
				}),
			};

			mockPut.mockResolvedValue(mockResponse);

			// フックをレンダリング
			const { result } = renderHookWithQueryClient(() => useUpdateTag());

			// mutateAsync を実行
			await result.current.mutateAsync(updateData);

			// モックが正しいパラメータで呼ばれたことを確認
			await waitFor(() => {
				expect(mockPut).toHaveBeenCalledWith({
					param: { id: "2" },
					json: {
						name: "新しいタグ",
						enName: undefined,
						slug: "new-tag",
					},
				});
			});
		});
	});
});
