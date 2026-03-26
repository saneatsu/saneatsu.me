import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleNewForm } from "./article-new-form";

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

vi.mock("@/entities/article", () => ({
	useCreate: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
	useCheckSlug: vi.fn(() => ({
		data: { available: true },
		isLoading: false,
	})),
	useUploadImage: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
	useDeleteImage: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
}));

vi.mock("@/entities/tag", () => ({
	useGetAllTags: vi.fn(() => ({
		data: {
			data: [
				{
					id: 1,
					slug: "test-tag",
					translations: { ja: "テストタグ", en: "Test Tag" },
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					articleCount: 0,
				},
			],
		},
		isLoading: false,
	})),
}));

vi.mock("@/features/article-editor", () => ({
	CustomMarkdownEditor: ({
		value,
		onChange,
	}: {
		value: string;
		onChange: (value: string) => void;
	}) => (
		<textarea
			data-testid="markdown-editor"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

vi.mock("../article-thumbnail-uploader/article-thumbnail-uploader", () => ({
	ArticleThumbnailUploader: () => (
		<div data-testid="thumbnail-uploader">Thumbnail Uploader</div>
	),
}));

vi.mock("../article-status-selector/article-status-selector", () => ({
	ArticleStatusSelector: () => (
		<div data-testid="status-selector">Status Selector</div>
	),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/shared/lib")>();
	return {
		...actual,
		useDebounce: vi.fn((value) => value),
	};
});

vi.mock("@/shared/ui", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/shared/ui")>();
	return {
		...actual,
		DateTimePicker: ({
			value,
			onChange,
			placeholder,
		}: {
			value?: Date;
			onChange: (date: Date | undefined) => void;
			placeholder?: string;
		}) => (
			<div data-testid="datetime-picker">
				<input
					aria-label="公開日時"
					type="text"
					value={value ? value.toISOString() : ""}
					onChange={(e) => {
						const newValue = e.target.value
							? new Date(e.target.value)
							: undefined;
						onChange(newValue);
					}}
					placeholder={placeholder}
				/>
			</div>
		),
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

describe("ArticleNewForm", () => {
	beforeEach(() => {
		mockPush.mockClear();
	});

	describe("Integration Test", () => {
		describe("未保存変更アラート", () => {
			it("未入力でキャンセルするとアラートなしでナビゲーションが実行される", async () => {
				// Given: フォームをレンダリング
				const user = userEvent.setup();
				render(<ArticleNewForm />, { wrapper });

				// When: キャンセルボタンをクリック
				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				// Then: アラートなしでナビゲーションが実行される
				expect(mockPush).toHaveBeenCalledWith("/admin/articles");
			});

			it("タイトルを入力してキャンセルするとアラートダイアログが表示される", async () => {
				// Given: タイトルを入力した状態
				const user = userEvent.setup();
				render(<ArticleNewForm />, { wrapper });

				const titleInput = screen.getByPlaceholderText(
					"記事のタイトルを入力してください"
				);
				await user.type(titleInput, "テスト記事");

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

			it("本文を入力してキャンセルするとアラートダイアログが表示される", async () => {
				// Given: 本文を入力した状態
				const user = userEvent.setup();
				render(<ArticleNewForm />, { wrapper });

				const editor = screen.getByTestId("markdown-editor");
				await user.type(editor, "テスト本文");

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

			it("アラートダイアログで「離脱する」をクリックするとナビゲーションが実行される", async () => {
				// Given: タイトルを入力してキャンセルし、アラートダイアログが表示されている状態
				const user = userEvent.setup();
				render(<ArticleNewForm />, { wrapper });

				const titleInput = screen.getByPlaceholderText(
					"記事のタイトルを入力してください"
				);
				await user.type(titleInput, "テスト記事");

				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				await waitFor(() => {
					expect(
						screen.getByText("変更が保存されていません")
					).toBeInTheDocument();
				});

				// When: 離脱ボタンをクリック
				const confirmButton = screen.getByRole("button", {
					name: "離脱する",
				});
				await user.click(confirmButton);

				// Then: ナビゲーションが実行される
				await waitFor(() => {
					expect(mockPush).toHaveBeenCalledWith("/admin/articles");
				});
			});

			it("アラートダイアログで「キャンセル」をクリックするとフォームに戻る", async () => {
				// Given: タイトルを入力してキャンセルし、アラートダイアログが表示されている状態
				const user = userEvent.setup();
				render(<ArticleNewForm />, { wrapper });

				const titleInput = screen.getByPlaceholderText(
					"記事のタイトルを入力してください"
				);
				await user.type(titleInput, "テスト記事");

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
	});
});
