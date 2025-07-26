import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleSearch } from "./article-search";

// next-intlのモック
vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => {
		const translations: Record<string, string> = {
			search: "検索",
		};
		return translations[key] || key;
	},
}));

describe("Unit Test", () => {
	describe("ArticleSearch", () => {
		const mockOnSearch = vi.fn();

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should render search input with default placeholder", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const input = screen.getByRole("textbox");
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute("placeholder", "検索");
		});

		it("should render search input with custom placeholder", () => {
			render(
				<ArticleSearch onSearch={mockOnSearch} placeholder="記事を検索..." />
			);

			const input = screen.getByRole("textbox");
			expect(input).toHaveAttribute("placeholder", "記事を検索...");
		});

		it("should render with initial query value", () => {
			render(
				<ArticleSearch onSearch={mockOnSearch} initialQuery="initial search" />
			);

			const input = screen.getByRole("textbox");
			expect(input).toHaveValue("initial search");
		});

		it("should call onSearch when form is submitted", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const input = screen.getByRole("textbox");
			const submitButton = screen.getByRole("button", { name: "検索" });

			fireEvent.change(input, { target: { value: "test query" } });
			fireEvent.click(submitButton);

			expect(mockOnSearch).toHaveBeenCalledWith("test query");
		});

		it("should call onSearch when Enter key is pressed", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const input = screen.getByRole("textbox");

			fireEvent.change(input, { target: { value: "test query" } });
			const form = input.closest("form");
			if (form) fireEvent.submit(form);

			expect(mockOnSearch).toHaveBeenCalledWith("test query");
		});

		it("should trim whitespace from query before calling onSearch", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const input = screen.getByRole("textbox");
			const submitButton = screen.getByRole("button", { name: "検索" });

			fireEvent.change(input, { target: { value: "  test query  " } });
			fireEvent.click(submitButton);

			expect(mockOnSearch).toHaveBeenCalledWith("test query");
		});

		it("should update input value when user types", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const input = screen.getByRole("textbox");

			fireEvent.change(input, { target: { value: "new search" } });

			expect(input).toHaveValue("new search");
		});

		it("should disable input and button when loading", () => {
			render(<ArticleSearch onSearch={mockOnSearch} isLoading={true} />);

			const input = screen.getByRole("textbox");
			const submitButton = screen.getByRole("button", { name: "..." });

			expect(input).toBeDisabled();
			expect(submitButton).toBeDisabled();
		});

		it("should show loading text on button when isLoading is true", () => {
			render(<ArticleSearch onSearch={mockOnSearch} isLoading={true} />);

			expect(screen.getByRole("button", { name: "..." })).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "検索" })
			).not.toBeInTheDocument();
		});

		it("should render search icon", () => {
			const { container } = render(<ArticleSearch onSearch={mockOnSearch} />);

			const searchIcon = container.querySelector("svg");
			expect(searchIcon).toBeInTheDocument();
		});

		it("should have proper form structure", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const form = screen.getByRole("textbox").closest("form");
			expect(form).toBeInTheDocument();
		});
	});
});

describe("Integration Test", () => {
	describe("ArticleSearch user interactions", () => {
		const mockOnSearch = vi.fn();

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should handle complete search workflow", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const input = screen.getByRole("textbox");
			const submitButton = screen.getByRole("button", { name: "検索" });

			// ユーザーが検索クエリを入力
			fireEvent.change(input, { target: { value: "React Hooks" } });
			expect(input).toHaveValue("React Hooks");

			// 検索ボタンをクリック
			fireEvent.click(submitButton);
			expect(mockOnSearch).toHaveBeenCalledWith("React Hooks");

			// フォームが再利用可能な状態であることを確認
			fireEvent.change(input, { target: { value: "TypeScript" } });
			const form = input.closest("form");
			if (form) fireEvent.submit(form);
			expect(mockOnSearch).toHaveBeenCalledWith("TypeScript");
		});

		it("should handle empty search submission", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const submitButton = screen.getByRole("button", { name: "検索" });

			// 空の状態で検索実行
			fireEvent.click(submitButton);
			expect(mockOnSearch).toHaveBeenCalledWith("");
		});

		it("should handle search with only whitespace", () => {
			render(<ArticleSearch onSearch={mockOnSearch} />);

			const input = screen.getByRole("textbox");
			const submitButton = screen.getByRole("button", { name: "検索" });

			// 空白文字のみを入力
			fireEvent.change(input, { target: { value: "   " } });
			fireEvent.click(submitButton);

			// トリミングされて空文字が渡されることを確認
			expect(mockOnSearch).toHaveBeenCalledWith("");
		});
	});
});
