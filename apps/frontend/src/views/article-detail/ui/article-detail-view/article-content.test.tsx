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
	// === パターン1: チャット閉 + 1カラム（< lg） ===
	describe("チャット閉時のデフォルトレイアウト（1カラム）", () => {
		it("should render grid with single column layout", () => {
			// Given: チャットが閉じている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={false} />
			);

			// Then: グリッドが1カラムで表示される
			const grid = container.firstElementChild;
			expect(grid?.className).toContain("grid-cols-1");
			expect(grid?.className).toContain("gap-8");
		});

		it("should place TOC with order-1 above article body", () => {
			// Given: チャットが閉じている状態
			render(<ArticleContent {...defaultProps} isChatOpen={false} />);

			// Then: TOCがorder-1で記事本文より上に配置される
			const aside = screen.getByRole("complementary");
			expect(aside.className).toContain("order-1");
		});

		it("should place article body with order-2 below TOC", () => {
			// Given: チャットが閉じている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={false} />
			);

			// Then: 記事本文がorder-2でTOCより下に配置される
			const articleBody = container.querySelector(".min-w-0");
			expect(articleBody?.className).toContain("order-2");
		});
	});

	// === パターン2: チャット閉 + 2カラム（>= lg） ===
	describe("チャット閉時のデスクトップレイアウト（2カラム、lgブレークポイント）", () => {
		it("should apply lg breakpoint for 2-column grid", () => {
			// Given: チャットが閉じている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={false} />
			);

			// Then: lg以上で2カラムグリッドが適用される
			const grid = container.firstElementChild;
			expect(grid?.className).toContain("lg:grid-cols-[1fr_300px]");
			expect(grid?.className).toContain("lg:gap-12");
		});

		it("should apply lg:order-1 to article body for left column", () => {
			// Given: チャットが閉じている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={false} />
			);

			// Then: lg以上で記事本文がlg:order-1（左カラム）になる
			const articleBody = container.querySelector(".min-w-0");
			expect(articleBody?.className).toContain("lg:order-1");
		});

		it("should apply lg breakpoint sticky sidebar to TOC", () => {
			// Given: チャットが閉じている状態
			render(<ArticleContent {...defaultProps} isChatOpen={false} />);

			// Then: lg以上でTOCがlg:order-2のstickyサイドバーになる
			const aside = screen.getByRole("complementary");
			expect(aside.className).toContain("lg:order-2");
			expect(aside.className).toContain("lg:sticky");
			expect(aside.className).toContain("lg:top-20");
			expect(aside.className).toContain("lg:h-fit");
			expect(aside.className).toContain("lg:w-[300px]");
		});
	});

	// === パターン3: チャット開 + 1カラム（< 1424px） ===
	describe("チャット開時のデフォルトレイアウト（1カラム）", () => {
		it("should render grid with single column layout", () => {
			// Given: チャットが開いている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={true} />
			);

			// Then: グリッドが1カラムで表示される
			const grid = container.firstElementChild;
			expect(grid?.className).toContain("grid-cols-1");
			expect(grid?.className).toContain("gap-8");
		});

		it("should not apply lg:grid-cols-[1fr_300px]", () => {
			// Given: チャットが開いている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={true} />
			);

			// Then: lgブレークポイントの2カラムが適用されない
			const grid = container.firstElementChild;
			expect(grid?.className).not.toContain("lg:grid-cols-[1fr_300px]");
		});

		it("should place TOC with order-1 above article body", () => {
			// Given: チャットが開いている状態
			render(<ArticleContent {...defaultProps} isChatOpen={true} />);

			// Then: TOCがorder-1で記事本文より上に配置される
			const aside = screen.getByRole("complementary");
			expect(aside.className).toContain("order-1");
		});

		it("should place article body with order-2 below TOC", () => {
			// Given: チャットが開いている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={true} />
			);

			// Then: 記事本文がorder-2でTOCより下に配置される
			const articleBody = container.querySelector(".min-w-0");
			expect(articleBody?.className).toContain("order-2");
		});
	});

	// === パターン4: チャット開 + 2カラム（>= 1424px） ===
	describe("チャット開時のワイドスクリーンレイアウト（2カラム、min-[1424px]ブレークポイント）", () => {
		it("should apply min-[1424px] breakpoint for 2-column grid", () => {
			// Given: チャットが開いている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={true} />
			);

			// Then: min-[1424px]以上で2カラムグリッドが適用される
			const grid = container.firstElementChild;
			expect(grid?.className).toContain("min-[1424px]:grid-cols-[1fr_300px]");
			expect(grid?.className).toContain("min-[1424px]:gap-12");
		});

		it("should apply min-[1424px]:order-1 to article body for left column", () => {
			// Given: チャットが開いている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={true} />
			);

			// Then: min-[1424px]以上で記事本文がmin-[1424px]:order-1（左カラム）になる
			const articleBody = container.querySelector(".min-w-0");
			expect(articleBody?.className).toContain("min-[1424px]:order-1");
		});

		it("should apply min-[1424px] breakpoint sticky sidebar to TOC", () => {
			// Given: チャットが開いている状態
			render(<ArticleContent {...defaultProps} isChatOpen={true} />);

			// Then: min-[1424px]以上でTOCがstickyサイドバーになる
			const aside = screen.getByRole("complementary");
			expect(aside.className).toContain("min-[1424px]:order-2");
			expect(aside.className).toContain("min-[1424px]:sticky");
			expect(aside.className).toContain("min-[1424px]:top-20");
			expect(aside.className).toContain("min-[1424px]:h-fit");
			expect(aside.className).toContain("min-[1424px]:w-[300px]");
		});
	});

	// === 境界値: ブレークポイントの正確性 ===
	describe("ブレークポイント境界値（クラス付与の正確性）", () => {
		it("should use lg breakpoint and not min-[1424px] when chat is closed", () => {
			// Given: チャットが閉じている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={false} />
			);

			// Then: lg:が使われ、min-[1424px]:は使われていない
			const grid = container.firstElementChild;
			expect(grid?.className).toContain("lg:grid-cols-[1fr_300px]");
			expect(grid?.className).not.toContain("min-[1424px]:");
		});

		it("should use min-[1424px] breakpoint and not lg:grid-cols when chat is open", () => {
			// Given: チャットが開いている状態
			const { container } = render(
				<ArticleContent {...defaultProps} isChatOpen={true} />
			);

			// Then: min-[1424px]:が使われ、lg:grid-colsは使われていない
			const grid = container.firstElementChild;
			expect(grid?.className).toContain("min-[1424px]:grid-cols-[1fr_300px]");
			expect(grid?.className).not.toContain("lg:grid-cols-[1fr_300px]");
		});

		it("should use lg:sticky for TOC sidebar when chat is closed", () => {
			// Given: チャットが閉じている状態
			render(<ArticleContent {...defaultProps} isChatOpen={false} />);

			// Then: lg:stickyが使われ、min-[1424px]:stickyは使われていない
			const aside = screen.getByRole("complementary");
			expect(aside.className).toContain("lg:sticky");
			expect(aside.className).not.toContain("min-[1424px]:sticky");
		});

		it("should use min-[1424px]:sticky for TOC sidebar when chat is open", () => {
			// Given: チャットが開いている状態
			render(<ArticleContent {...defaultProps} isChatOpen={true} />);

			// Then: min-[1424px]:stickyが使われ、lg:stickyは使われていない
			const aside = screen.getByRole("complementary");
			expect(aside.className).toContain("min-[1424px]:sticky");
			expect(aside.className).not.toContain("lg:sticky");
		});
	});
});
