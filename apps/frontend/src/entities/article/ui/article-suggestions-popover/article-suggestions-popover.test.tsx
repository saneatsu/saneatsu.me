import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SuggestionItem } from "@/entities/article";

import { ArticleSuggestionsPopover } from "./article-suggestions-popover";

// モックデータ
const mockSuggestions: SuggestionItem[] = [
	{
		slug: "react-basics",
		title: "React基礎",
		type: "article",
	},
	{
		slug: "typescript-guide",
		title: "TypeScript入門",
		type: "article",
	},
	{
		slug: "react-basics",
		title: "コンポーネントの作成",
		articleTitle: "React基礎",
		headingId: "creating-components",
		type: "heading",
	},
	{
		slug: "typescript-guide",
		title: "型定義の基本",
		articleTitle: "TypeScript入門",
		headingId: "type-basics",
		type: "heading",
	},
];

// APIレスポンスのモック
const mockApiResponse = {
	suggestions: mockSuggestions,
};

// useHonoClientのモック
const mockGet = vi.fn();
vi.mock("@/shared/lib", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/shared/lib")>();
	return {
		...actual,
		useHonoClient: () => ({
			api: {
				articles: {
					suggestions: {
						$get: mockGet,
					},
				},
			},
		}),
	};
});

// fetch関数のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// scrollIntoViewのモック
Element.prototype.scrollIntoView = vi.fn();

// テスト用のQueryClientを作成
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

const renderWithQueryClient = (component: React.ReactElement) => {
	const queryClient = createTestQueryClient();
	return render(
		<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
	);
};

describe("Unit Test", () => {
	describe("ArticleSuggestionsPopover", () => {
		const defaultProps = {
			open: true,
			onOpenChange: vi.fn(),
			query: "test",
			language: "ja" as const,
			onSelect: vi.fn(),
			position: { top: 100, left: 200 },
		};

		beforeEach(() => {
			vi.clearAllMocks();
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse,
			});
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse,
			});
		});

		afterEach(() => {
			vi.clearAllMocks();
		});

		it("should not render when open is false", () => {
			renderWithQueryClient(
				<ArticleSuggestionsPopover {...defaultProps} open={false} />
			);

			expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
			expect(screen.queryByText("記事")).not.toBeInTheDocument();
		});

		it("should show loading state initially", () => {
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			expect(screen.getByText("読み込み中...")).toBeInTheDocument();
		});

		it("should show empty state when no suggestions", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ suggestions: [] }),
			});
			mockGet.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ suggestions: [] }),
			});

			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				expect(
					screen.getByText("該当する記事が見つかりません")
				).toBeInTheDocument();
			});
		});

		it("should display article suggestions", async () => {
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				// グループヘッダーを確認
				expect(screen.getByText("記事")).toBeInTheDocument();
				// 記事タイトルをFileTextアイコンと一緒に確認
				const articleItems = screen.getAllByRole("option");
				expect(articleItems[0]).toHaveTextContent("React基礎");
				expect(articleItems[1]).toHaveTextContent("TypeScript入門");
			});
		});

		it("should display heading suggestions", async () => {
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("見出し")).toBeInTheDocument();
				expect(screen.getByText("コンポーネントの作成")).toBeInTheDocument();
				expect(screen.getByText("型定義の基本")).toBeInTheDocument();
			});
		});

		it("should call onSelect when article is clicked", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const articleItems = screen.getAllByRole("option");
				expect(articleItems[0]).toHaveTextContent("React基礎");
			});

			// 最初のオプションをクリック
			const firstOption = screen.getAllByRole("option")[0];
			await user.click(firstOption);

			expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSuggestions[0]);
		});

		it("should call onSelect when heading is clicked", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				expect(screen.getByText("コンポーネントの作成")).toBeInTheDocument();
			});

			await user.click(screen.getByText("コンポーネントの作成"));

			expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSuggestions[2]);
		});

		it("should navigate with ArrowDown key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// テキストエリアを作成してフォーカス
			const textarea = document.createElement("textarea");
			document.body.appendChild(textarea);
			textarea.focus();

			// ArrowDownキーを押す
			await user.keyboard("{ArrowDown}");

			// 2番目のアイテムが選択されていることを確認
			const secondItem = screen.getAllByRole("option")[1];
			expect(secondItem).toHaveClass("bg-accent");

			// クリーンアップ
			document.body.removeChild(textarea);
		});

		it("should navigate with ArrowUp key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// テキストエリアを作成してフォーカス
			const textarea = document.createElement("textarea");
			document.body.appendChild(textarea);
			textarea.focus();

			// 最後のアイテムに移動してから上へ
			await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
			await user.keyboard("{ArrowUp}");

			// 3番目のアイテムが選択されていることを確認
			const thirdItem = screen.getAllByRole("option")[2];
			expect(thirdItem).toHaveClass("bg-accent");

			// クリーンアップ
			document.body.removeChild(textarea);
		});

		it("should navigate with Tab key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// Tabキーを押す
			await user.keyboard("{Tab}");

			// 2番目のアイテムが選択されていることを確認
			const secondItem = screen.getAllByRole("option")[1];
			expect(secondItem).toHaveClass("bg-accent");
		});

		it("should navigate with Shift+Tab key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// Shift+Tabキーを押す（最初のアイテムから最後へ）
			await user.keyboard("{Shift>}{Tab}{/Shift}");

			// 最後のアイテムが選択されていることを確認
			const lastItem = screen.getAllByRole("option")[3];
			expect(lastItem).toHaveClass("bg-accent");
		});

		it("should navigate with Ctrl+N key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// テキストエリアを作成してフォーカス
			const textarea = document.createElement("textarea");
			document.body.appendChild(textarea);
			textarea.focus();

			// Ctrl+Nキーを押す
			await user.keyboard("{Control>}n{/Control}");

			// 2番目のアイテムが選択されていることを確認
			const secondItem = screen.getAllByRole("option")[1];
			expect(secondItem).toHaveClass("bg-accent");

			// クリーンアップ
			document.body.removeChild(textarea);
		});

		it("should navigate with Ctrl+P key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// テキストエリアを作成してフォーカス
			const textarea = document.createElement("textarea");
			document.body.appendChild(textarea);
			textarea.focus();

			// 2番目に移動してから上へ
			await user.keyboard("{Control>}n{/Control}");
			await user.keyboard("{Control>}p{/Control}");

			// 最初のアイテムが選択されていることを確認
			const firstItem = screen.getAllByRole("option")[0];
			expect(firstItem).toHaveClass("bg-accent");

			// クリーンアップ
			document.body.removeChild(textarea);
		});

		it("should select item with Enter key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// テキストエリアを作成してフォーカス
			const textarea = document.createElement("textarea");
			document.body.appendChild(textarea);
			textarea.focus();

			// Enterキーを押す
			await user.keyboard("{Enter}");

			expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSuggestions[0]);

			// クリーンアップ
			document.body.removeChild(textarea);
		});

		it("should close with Escape key", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// Escapeキーを押す
			await user.keyboard("{Escape}");

			expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
		});

		it("should apply correct position styles", async () => {
			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				const popover = document.querySelector(".fixed.z-50");
				expect(popover).toHaveStyle({
					top: "105px", // position.top + minOffset (100 + 5)
					left: "200px",
				});
			});
		});

		it("should adjust position when cursor is in bottom half of screen", async () => {
			// ウィンドウの高さをモック
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 800,
			});

			renderWithQueryClient(
				<ArticleSuggestionsPopover
					{...defaultProps}
					position={{ top: 600, left: 200 }}
				/>
			);

			await waitFor(() => {
				const popover = document.querySelector(".fixed.z-50");
				// 下半分にカーソルがある場合は上に表示
				expect(popover).toHaveStyle({
					top: "295px", // 600 - 300(popoverHeight) - 5(minOffset)
					left: "200px",
				});
			});
		});

		it("should reset selected index when reopened", async () => {
			const queryClient = createTestQueryClient();
			const { rerender } = render(
				<QueryClientProvider client={queryClient}>
					<ArticleSuggestionsPopover {...defaultProps} />
				</QueryClientProvider>
			);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// 2番目のアイテムに移動
			const user = userEvent.setup();
			await user.keyboard("{Tab}");

			// 2番目が選択されていることを確認
			const secondItem = screen.getAllByRole("option")[1];
			expect(secondItem).toHaveClass("bg-accent");

			// 一度閉じる
			rerender(
				<QueryClientProvider client={queryClient}>
					<ArticleSuggestionsPopover {...defaultProps} open={false} />
				</QueryClientProvider>
			);

			// 再度開く
			rerender(
				<QueryClientProvider client={queryClient}>
					<ArticleSuggestionsPopover {...defaultProps} open={true} />
				</QueryClientProvider>
			);

			await waitFor(() => {
				// 最初のアイテムが選択されていることを確認
				const firstItem = screen.getAllByRole("option")[0];
				expect(firstItem).toHaveClass("bg-accent");
			});
		});

		it("should fetch all suggestions when query is empty", async () => {
			vi.clearAllMocks(); // 事前にクリア
			renderWithQueryClient(
				<ArticleSuggestionsPopover {...defaultProps} query="" open={true} />
			);

			// waitForを使用して非同期処理を待つ
			await waitFor(() => {
				// 空のクエリでも全記事を表示するために、APIが呼ばれる
				expect(mockGet).toHaveBeenCalledWith({
					query: {
						q: "",
						lang: "ja",
						limit: "20",
					},
				});
			});
		});

		it("should not fetch suggestions when closed", async () => {
			vi.clearAllMocks(); // 事前にクリア
			renderWithQueryClient(
				<ArticleSuggestionsPopover {...defaultProps} open={false} />
			);

			// waitForを使用して非同期処理を待つ
			await waitFor(() => {
				// openがfalseの場合、コンポーネントがnullを返すのでfetchも呼ばれない
				expect(mockGet).not.toHaveBeenCalled();
			});
		});
	});
});

describe("Integration Test", () => {
	describe("ArticleSuggestionsPopover with API", () => {
		const defaultProps = {
			open: true,
			onOpenChange: vi.fn(),
			query: "react",
			language: "ja" as const,
			onSelect: vi.fn(),
			position: { top: 100, left: 200 },
		};

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should handle API errors gracefully", async () => {
			mockGet.mockRejectedValueOnce(new Error("Network error"));

			renderWithQueryClient(<ArticleSuggestionsPopover {...defaultProps} />);

			await waitFor(() => {
				// エラー時は空の状態を表示
				expect(
					screen.getByText("該当する記事が見つかりません")
				).toBeInTheDocument();
			});
		});

		it("should handle language change", async () => {
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse,
			});

			const queryClient = createTestQueryClient();
			const { rerender } = render(
				<QueryClientProvider client={queryClient}>
					<ArticleSuggestionsPopover {...defaultProps} />
				</QueryClientProvider>
			);

			await waitFor(() => {
				const options = screen.getAllByRole("option");
				expect(options).toHaveLength(4);
			});

			// 言語を変更
			rerender(
				<QueryClientProvider client={queryClient}>
					<ArticleSuggestionsPopover {...defaultProps} language="en" />
				</QueryClientProvider>
			);

			// 新しいAPIコールが発生することを確認
			await waitFor(() => {
				expect(mockGet).toHaveBeenCalledTimes(2);
				// 2回目の呼び出しはlang=enを含むクエリパラメータで呼ばれるはず
				const secondCall = mockGet.mock.calls[1];
				expect(secondCall[0]).toEqual({
					query: {
						q: "react",
						lang: "en",
						limit: "20",
					},
				});
			});
		});
	});
});
