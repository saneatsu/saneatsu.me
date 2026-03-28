import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TagCreateForm } from "./tag-create-form";

// Mock dependencies
const mockPush = vi.fn();
vi.mock("next/navigation", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/navigation")>();
	return {
		...actual,
		useRouter: vi.fn(() => ({
			push: mockPush,
			replace: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
			prefetch: vi.fn(),
		})),
	};
});

const { mockCreateMutateAsync } = vi.hoisted(() => ({
	mockCreateMutateAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/entities/tag", () => ({
	useCreateTag: vi.fn(() => ({
		mutateAsync: mockCreateMutateAsync,
		isPending: false,
	})),
}));

vi.mock("sonner", async (importOriginal) => {
	const actual = await importOriginal<typeof import("sonner")>();
	return {
		...actual,
		toast: {
			...actual.toast,
			success: vi.fn(),
		},
	};
});

/**
 * テスト用のQueryClientを作成するヘルパー関数
 */
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

/**
 * テスト用のラッパーコンポーネント
 */
const wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={createTestQueryClient()}>
		{children}
	</QueryClientProvider>
);

describe("TagCreateForm", () => {
	beforeEach(() => {
		mockPush.mockClear();
		mockCreateMutateAsync.mockClear();
		vi.mocked(toast.success).mockClear();
	});

	describe("Integration Test", () => {
		describe("未保存変更アラート", () => {
			it("未入力でキャンセルするとアラートなしでナビゲーションが実行される", async () => {
				// Given: フォームをレンダリング
				const user = userEvent.setup();
				render(<TagCreateForm />, { wrapper });

				// When: キャンセルボタンをクリック
				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				// Then: アラートなしでナビゲーションが実行される
				expect(mockPush).toHaveBeenCalledWith("/admin/tags");
			});

			it("タグ名を入力してキャンセルするとアラートダイアログが表示される", async () => {
				// Given: タグ名を入力した状態
				const user = userEvent.setup();
				render(<TagCreateForm />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.type(nameInput, "テストタグ");

				// When: キャンセルボタンをクリック
				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				// Then: アラートダイアログが表示される
				await waitFor(() => {
					expect(
						screen.getByText("変更が保存されていません")
					).toBeInTheDocument();
				});
			});

			it("アラートダイアログで「変更を破棄」をクリックするとナビゲーションが実行される", async () => {
				// Given: タグ名を入力してキャンセルし、アラートダイアログが表示されている状態
				const user = userEvent.setup();
				render(<TagCreateForm />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.type(nameInput, "テストタグ");

				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				await waitFor(() => {
					expect(
						screen.getByText("変更が保存されていません")
					).toBeInTheDocument();
				});

				// When: 変更を破棄ボタンをクリック
				const confirmButton = screen.getByRole("button", {
					name: "変更を破棄",
				});
				await user.click(confirmButton);

				// Then: ナビゲーションが実行される
				await waitFor(() => {
					expect(mockPush).toHaveBeenCalledWith("/admin/tags");
				});
			});

			it("アラートダイアログで「キャンセル」をクリックするとフォームに戻る", async () => {
				// Given: タグ名を入力してキャンセルし、アラートダイアログが表示されている状態
				const user = userEvent.setup();
				render(<TagCreateForm />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.type(nameInput, "テストタグ");

				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				await waitFor(() => {
					expect(
						screen.getByText("変更が保存されていません")
					).toBeInTheDocument();
				});

				// When: ダイアログのキャンセルボタンをクリック
				const dialogCancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(dialogCancelButton);

				// Then: ナビゲーションが実行されず、フォームに戻る
				expect(mockPush).not.toHaveBeenCalled();
				await waitFor(() => {
					expect(
						screen.queryByText("変更が保存されていません")
					).not.toBeInTheDocument();
				});
			});
		});

		describe("成功トースト", () => {
			it("作成成功後に成功トーストが表示される", async () => {
				// Given: フォームに値を入力
				const user = userEvent.setup();
				render(<TagCreateForm />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				const slugInput = screen.getByPlaceholderText("typescript");
				await user.type(nameInput, "テストタグ");
				await user.type(slugInput, "test-tag");

				// When: フォームを送信
				const submitButton = screen.getByRole("button", { name: "作成" });
				await user.click(submitButton);

				// Then: 成功トーストが表示される
				await waitFor(() => {
					expect(mockCreateMutateAsync).toHaveBeenCalled();
				});
				expect(toast.success).toHaveBeenCalled();
			});
		});
	});
});
