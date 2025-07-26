import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Article } from "../../../shared";
import { ArticleDetailView } from "./article-detail-view";

// next-intlのモック
vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => {
		const translations: Record<string, string> = {
			publishedAt: "公開日",
			backToList: "一覧に戻る",
		};
		return translations[key] || key;
	},
}));

// ReactMarkdownのモック
vi.mock("react-markdown", () => ({
	default: ({ children }: { children: string }) => (
		<div data-testid="markdown-content">{children}</div>
	),
}));

// RemarkとRehypeプラグインのモック
vi.mock("remark-gfm", () => ({ default: {} }));
vi.mock("rehype-highlight", () => ({ default: {} }));

describe("Unit Test", () => {
	describe("ArticleDetailView", () => {
		const mockArticle: Article = {
			id: 1,
			slug: "test-article",
			cfImageId: null,
			status: "published",
			publishedAt: "2024-01-15T10:00:00Z",
			title: "テスト記事",
			content: "これはテスト記事の内容です。",
		};

		it("should render article title correctly", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			expect(
				screen.getByRole("heading", { level: 1, name: "テスト記事" })
			).toBeInTheDocument();
		});

		it("should render published date in Japanese format when locale is ja", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			expect(screen.getByText("公開日: 2024年1月15日")).toBeInTheDocument();
		});

		it("should render published date in English format when locale is en", () => {
			render(<ArticleDetailView article={mockArticle} locale="en" />);

			expect(screen.getByText("公開日: January 15, 2024")).toBeInTheDocument();
		});

		it("should render published status badge in Japanese when locale is ja", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			expect(screen.getByText("公開")).toBeInTheDocument();
		});

		it("should render published status badge in English when locale is en", () => {
			render(<ArticleDetailView article={mockArticle} locale="en" />);

			expect(screen.getByText("Published")).toBeInTheDocument();
		});

		it("should render draft status badge in Japanese when article is draft and locale is ja", () => {
			const draftArticle = { ...mockArticle, status: "draft" as const };
			render(<ArticleDetailView article={draftArticle} locale="ja" />);

			expect(screen.getByText("下書き")).toBeInTheDocument();
		});

		it("should render draft status badge in English when article is draft and locale is en", () => {
			const draftArticle = { ...mockArticle, status: "draft" as const };
			render(<ArticleDetailView article={draftArticle} locale="en" />);

			expect(screen.getByText("Draft")).toBeInTheDocument();
		});

		it("should render article content through ReactMarkdown", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			const markdownContent = screen.getByTestId("markdown-content");
			expect(markdownContent).toBeInTheDocument();
			expect(markdownContent).toHaveTextContent("これはテスト記事の内容です。");
		});

		it("should render back to list link with correct href", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			const backLink = screen.getByRole("link", { name: "← 一覧に戻る" });
			expect(backLink).toBeInTheDocument();
			expect(backLink).toHaveAttribute("href", "/ja");
		});

		it("should handle article without published date", () => {
			const unpublishedArticle = { ...mockArticle, publishedAt: null };
			render(<ArticleDetailView article={unpublishedArticle} locale="ja" />);

			// 公開日が表示されないことを確認
			expect(screen.queryByText(/公開日:/)).not.toBeInTheDocument();
		});

		it("should have proper semantic structure", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			// main, article, header, footer要素が存在することを確認
			expect(screen.getByRole("main")).toBeInTheDocument();
			expect(screen.getByRole("article")).toBeInTheDocument();

			const { container } = render(
				<ArticleDetailView article={mockArticle} locale="ja" />
			);
			expect(container.querySelector("header")).toBeInTheDocument();
			expect(container.querySelector("footer")).toBeInTheDocument();
		});

		it("should render time element with correct datetime attribute", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			const timeElement = screen.getByRole("time");
			expect(timeElement).toBeInTheDocument();
			expect(timeElement).toHaveAttribute("dateTime", "2024-01-15T10:00:00Z");
		});
	});
});

describe("Integration Test", () => {
	describe("ArticleDetailView with different locales", () => {
		const mockArticle: Article = {
			id: 1,
			slug: "test-article",
			cfImageId: null,
			status: "published",
			publishedAt: "2024-01-15T10:00:00Z",
			title: "テスト記事",
			content: "これはテスト記事の内容です。",
		};

		it("should render complete article layout with Japanese locale", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			// 全体の構造が正しく表示されることを確認
			expect(screen.getByRole("main")).toBeInTheDocument();
			expect(screen.getByRole("article")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
			expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
			expect(screen.getByRole("link")).toBeInTheDocument();

			// 日本語ロケール固有の表示確認
			expect(screen.getByText("公開")).toBeInTheDocument();
			expect(screen.getByText("2024年1月15日")).toBeInTheDocument();
		});

		it("should render complete article layout with English locale", () => {
			render(<ArticleDetailView article={mockArticle} locale="en" />);

			// 全体の構造が正しく表示されることを確認
			expect(screen.getByRole("main")).toBeInTheDocument();
			expect(screen.getByRole("article")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
			expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
			expect(screen.getByRole("link")).toBeInTheDocument();

			// 英語ロケール固有の表示確認
			expect(screen.getByText("Published")).toBeInTheDocument();
			expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
		});
	});
});
