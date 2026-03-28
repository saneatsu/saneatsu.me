import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleEditForm } from "./article-edit-form";

// Mock dependencies
vi.mock("next/navigation", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/navigation")>();
	return {
		...actual,
		useRouter: vi.fn(() => ({
			push: vi.fn(),
			replace: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
			prefetch: vi.fn(),
		})),
	};
});

vi.mock("@/entities/article", () => ({
	useUpdate: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
	useCheckSlug: vi.fn(() => ({
		data: { available: true },
		isLoading: false,
	})),
	useUploadThumbnail: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
	useDeleteThumbnail: vi.fn(() => ({
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

/** テスト用の記事データ */
const createMockArticle = (overrides = {}) => ({
	id: 1,
	title: "Test Article",
	slug: "test-article",
	content: "Test content",
	status: "published" as const,
	publishedAt: "2024-01-15T10:30:00.000Z",
	updatedAt: "2024-01-15T10:30:00.000Z",
	cfImageId: null,
	tags: [],
	...overrides,
});

const mockHistoryBack = vi.fn();

describe("ArticleEditForm", () => {
	beforeEach(() => {
		mockHistoryBack.mockClear();
		Object.defineProperty(window, "history", {
			value: {
				...window.history,
				back: mockHistoryBack,
				pushState: vi.fn(),
				go: vi.fn(),
			},
			writable: true,
		});
	});

	describe("Unit Test", () => {
		describe("publishedAt フィールドの処理", () => {
			it("ISO 8601形式の publishedAt を持つ記事で正しい値が表示される", async () => {
				// Arrange: ISO 8601形式の公開日時を持つ記事データを用意
				const article = {
					id: 1,
					title: "Test Article",
					slug: "test-article",
					content: "Test content",
					status: "published" as const,
					publishedAt: "2024-01-15T10:30:00.000Z", // ISO 8601形式
					updatedAt: "2024-01-15T10:30:00.000Z",
					cfImageId: null,
					tags: [],
				};

				// Act: フォームをレンダリング
				render(<ArticleEditForm article={article} />, { wrapper });

				// Assert: DateTimePickerに正しい値が渡されていることを確認
				await waitFor(() => {
					const publishedAtInput = screen.getByLabelText(
						"公開日時"
					) as HTMLInputElement;

					// ISO 8601形式の日付が表示されるべき
					expect(publishedAtInput.value).toBeTruthy();
					expect(publishedAtInput.value).toBe("2024-01-15T10:30:00.000Z");
				});
			});

			it("publishedAt が null の記事で DateTimePicker が空になる", async () => {
				// Arrange: publishedAtがnullの記事データを用意
				const article = {
					id: 1,
					title: "Draft Article",
					slug: "draft-article",
					content: "Draft content",
					status: "published" as const,
					publishedAt: null,
					updatedAt: "2024-01-15T10:30:00.000Z",
					cfImageId: null,
					tags: [],
				};

				// Act: フォームをレンダリング
				render(<ArticleEditForm article={article} />, { wrapper });

				// Assert: DateTimePickerフィールドが空であることを確認
				await waitFor(() => {
					const publishedAtInput = screen.getByLabelText(
						"公開日時"
					) as HTMLInputElement;
					expect(publishedAtInput.value).toBe("");
				});
			});
		});
	});

	describe("Integration Test", () => {
		describe("未保存変更アラート", () => {
			it("変更なしでキャンセルするとアラートなしでナビゲーションが実行される", async () => {
				// Given: 変更なしのフォーム
				const user = userEvent.setup();
				render(<ArticleEditForm article={createMockArticle()} />, {
					wrapper,
				});

				// When: キャンセルボタンをクリック
				const cancelButton = screen.getByRole("button", {
					name: "キャンセル",
				});
				await user.click(cancelButton);

				// Then: アラートなしでナビゲーションが実行される
				expect(mockHistoryBack).toHaveBeenCalledTimes(1);
			});

			it("タイトルを変更してキャンセルするとアラートダイアログが表示される", async () => {
				// Given: タイトルを変更した状態
				const user = userEvent.setup();
				render(<ArticleEditForm article={createMockArticle()} />, {
					wrapper,
				});

				const titleInput = screen.getByDisplayValue("Test Article");
				await user.clear(titleInput);
				await user.type(titleInput, "Modified Title");

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
				// Given: タイトルを変更してアラートダイアログを表示
				const user = userEvent.setup();
				render(<ArticleEditForm article={createMockArticle()} />, {
					wrapper,
				});

				const titleInput = screen.getByDisplayValue("Test Article");
				await user.clear(titleInput);
				await user.type(titleInput, "Modified Title");

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
					expect(mockHistoryBack).toHaveBeenCalledTimes(1);
				});
			});

			it("アラートダイアログで「キャンセル」をクリックするとフォームに戻る", async () => {
				// Given: タイトルを変更してアラートダイアログを表示
				const user = userEvent.setup();
				render(<ArticleEditForm article={createMockArticle()} />, {
					wrapper,
				});

				const titleInput = screen.getByDisplayValue("Test Article");
				await user.clear(titleInput);
				await user.type(titleInput, "Modified Title");

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
				expect(mockHistoryBack).not.toHaveBeenCalled();
				await waitFor(() => {
					expect(
						screen.queryByText("変更が保存されていません")
					).not.toBeInTheDocument();
				});
			});
		});
	});
});
