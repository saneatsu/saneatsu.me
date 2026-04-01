import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Article } from "@/shared";
import type { HeadingItem } from "@/shared/lib";

import { ArticleContent } from "./article-content";

// next-intlのモック
vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => {
		const translations: Record<string, string> = {
			openChat: "記事について質問",
			copyMarkdownTooltip: "Markdownをコピー",
			copyMarkdownSuccess: "コピーしました",
			tableOfContents: "目次",
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

const mockArticle: Article = {
	id: 1,
	slug: "test-article",
	cfImageId: null,
	status: "published",
	publishedAt: "2024-01-15T10:00:00Z",
	title: "テスト記事",
	content: "これはテスト記事の内容です。",
	viewCount: 42,
	tags: [],
};

const mockHeadings: HeadingItem[] = [
	{ id: "heading-1", text: "見出し1", level: 2 },
];

const defaultProps = {
	article: mockArticle,
	locale: "ja" as const,
	articleUrl: "https://saneatsu.me/blog/test-article",
	headings: mockHeadings,
	articleContent: mockArticle.content,
	isChatOpen: false,
	onToggleChat: vi.fn(),
};

describe("Unit Test", () => {
	describe("ArticleContent - grid layout when chat is closed", () => {
		it("should apply lg:grid-cols-[1fr_300px] for 2-column layout", () => {
			// Given: チャットが閉じている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={false} />
			);

			// Then: lg以上で2カラムレイアウトが適用される
			const grid = container.firstElementChild;
			expect(grid?.className).toContain("lg:grid-cols-[1fr_300px]");
			expect(grid?.className).toContain("lg:gap-12");
		});

		it("should apply order classes for proper column ordering", () => {
			// Given: チャットが閉じている状態
			render(<ArticleContent {...defaultProps} isChatOpen={false} />);

			// Then: 記事本文がorder-2 lg:order-1、目次がorder-1 lg:order-2
			const aside = screen.getByRole("complementary");
			expect(aside.className).toContain("order-1");
			expect(aside.className).toContain("lg:order-2");
		});
	});

	describe("ArticleContent - grid layout when chat is open", () => {
		it("should not apply lg:grid-cols-[1fr_300px] for single-column layout", () => {
			// Given: チャットが開いている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={true} />
			);

			// Then: 2カラムレイアウトが適用されない（常に1カラム）
			const grid = container.firstElementChild;
			expect(grid?.className).not.toContain("lg:grid-cols-[1fr_300px]");
			expect(grid?.className).not.toContain("lg:gap-12");
		});

		it("should not apply lg:order classes when chat is open", () => {
			// Given: チャットが開いている状態
			render(<ArticleContent {...defaultProps} isChatOpen={true} />);

			// Then: 目次サイドバーにlg:order-2が適用されない（チャットが開いているので常にデフォルト順序）
			const aside = screen.getByRole("complementary");
			expect(aside.className).not.toContain("lg:order-2");
		});
	});
});
