import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Tag } from "@/shared/model";

import { TagUpdateForm } from "./tag-update-form";

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

const { mockMutateAsync } = vi.hoisted(() => ({
	mockMutateAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/entities/tag", () => ({
	useUpdateTag: vi.fn(() => ({
		mutateAsync: mockMutateAsync,
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

/** テスト用のタグデータ */
const mockTag: Tag = {
	id: 1,
	slug: "typescript",
	translations: { ja: "タイプスクリプト", en: "TypeScript" },
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	articleCount: 0,
};

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

describe("TagUpdateForm", () => {
	beforeEach(() => {
		mockPush.mockClear();
		mockMutateAsync.mockClear();
		vi.mocked(toast.success).mockClear();
	});

	describe("Integration Test", () => {
		describe("未保存変更アラート", () => {
			it("未変更でキャンセルするとアラートなしでナビゲーションが実行される", async () => {
				// Given: フォームをレンダリング（初期値が設定済み）
				const user = userEvent.setup();
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				// When: キャンセルボタンをクリック
				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				// Then: アラートなしでナビゲーションが実行される
				expect(mockPush).toHaveBeenCalledWith("/admin/tags");
			});

			it("タグ名を変更してキャンセルするとアラートダイアログが表示される", async () => {
				// Given: タグ名を変更した状態
				const user = userEvent.setup();
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.clear(nameInput);
				await user.type(nameInput, "変更されたタグ名");

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
				// Given: タグ名を変更してキャンセルし、アラートダイアログが表示されている状態
				const user = userEvent.setup();
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.clear(nameInput);
				await user.type(nameInput, "変更されたタグ名");

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
				// Given: タグ名を変更してキャンセルし、アラートダイアログが表示されている状態
				const user = userEvent.setup();
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.clear(nameInput);
				await user.type(nameInput, "変更されたタグ名");

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

		describe("更新ボタンの無効化", () => {
			it("フォーム未変更時は更新ボタンが無効になっている", async () => {
				// Given: フォームをレンダリング（初期値が設定済み）
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				// Then: 更新ボタンが無効
				const submitButton = screen.getByRole("button", { name: "更新" });
				expect(submitButton).toBeDisabled();
			});

			it("フォーム変更後は更新ボタンが有効になる", async () => {
				// Given: フォームをレンダリング
				const user = userEvent.setup();
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				// When: タグ名を変更
				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.clear(nameInput);
				await user.type(nameInput, "変更されたタグ名");

				// Then: 更新ボタンが有効
				const submitButton = screen.getByRole("button", { name: "更新" });
				expect(submitButton).toBeEnabled();
			});
		});

		describe("更新後のリダイレクト", () => {
			it("更新成功後にリダイレクトせず現在のページに留まる", async () => {
				// Given: フォームをレンダリングし、タグ名を変更
				const user = userEvent.setup();
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.clear(nameInput);
				await user.type(nameInput, "変更されたタグ名");

				// When: フォームを送信
				const submitButton = screen.getByRole("button", { name: "更新" });
				await user.click(submitButton);

				// Then: mutation は呼ばれるがリダイレクトは発生しない
				await waitFor(() => {
					expect(mockMutateAsync).toHaveBeenCalled();
				});
				expect(mockPush).not.toHaveBeenCalled();
			});
		});

		describe("成功トースト", () => {
			it("更新成功後に成功トーストが表示される", async () => {
				// Given: フォームをレンダリングし、タグ名を変更
				const user = userEvent.setup();
				render(<TagUpdateForm tag={mockTag} />, { wrapper });

				const nameInput = screen.getByPlaceholderText("タイプスクリプト");
				await user.clear(nameInput);
				await user.type(nameInput, "変更されたタグ名");

				// When: フォームを送信
				const submitButton = screen.getByRole("button", { name: "更新" });
				await user.click(submitButton);

				// Then: 成功トーストが表示される
				await waitFor(() => {
					expect(mockMutateAsync).toHaveBeenCalled();
				});
				expect(toast.success).toHaveBeenCalled();
			});
		});
	});
});
