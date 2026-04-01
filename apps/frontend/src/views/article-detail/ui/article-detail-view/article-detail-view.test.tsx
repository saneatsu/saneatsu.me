import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Article } from "@/shared";

import { ArticleDetailView } from "./article-detail-view";

// next-intlのモック
let mockLocale = "ja";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => {
		const translations: Record<string, string> = {
			publishedAt: "公開日",
			backToList: "一覧に戻る",
			openChat: "記事について質問",
			copyMarkdownTooltip: "Markdownをコピー",
			copyMarkdownSuccess: "コピーしました",
			"relatedArticles.title": "関連記事",
			tableOfContents: "目次",
		};
		return translations[key] || key;
	},
	useLocale: () => mockLocale,
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

// ArticleChatPanelのモック
vi.mock("@/features/article-chat", () => ({
	ArticleChatPanel: ({
		onClose,
	}: {
		articleContent: string;
		onClose: () => void;
	}) => (
		<div data-testid="chat-panel">
			<button type="button" onClick={onClose} aria-label="Close chat">
				Close
			</button>
		</div>
	),
}));

// RelatedArticlesのモック
vi.mock("@/features/article-management", () => ({
	RelatedArticles: ({ slug, limit }: { slug: string; limit: number }) => (
		<div data-testid="related-articles">
			Related articles for {slug} (limit: {limit})
		</div>
	),
}));

// useChatPanelPortalのモック
const { mockSetChatNode } = vi.hoisted(() => ({
	mockSetChatNode: vi.fn(),
}));

vi.mock("@/shared/ui", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		useChatPanelPortal: () => ({
			chatNode: null,
			setChatNode: mockSetChatNode,
			isChatOpen: false,
		}),
	};
});

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
			viewCount: 42,
			tags: [],
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
			mockLocale = "en";
			render(<ArticleDetailView article={mockArticle} locale="en" />);

			expect(screen.getByText("公開日: January 15, 2024")).toBeInTheDocument();
			mockLocale = "ja"; // Reset to default
		});

		it("should render article content through ReactMarkdown", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			const markdownContent = screen.getByTestId("markdown-content");
			expect(markdownContent).toBeInTheDocument();
			expect(markdownContent).toHaveTextContent("これはテスト記事の内容です。");
		});

		// Note: back to list link is not currently implemented in ArticleDetailView
		it.skip("should render back to list link with correct href", () => {
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

			// article, header要素が存在することを確認
			// mainはレイアウト側で提供されるため、ArticleDetailView内にはない
			expect(screen.getByRole("article")).toBeInTheDocument();

			const { container } = render(
				<ArticleDetailView article={mockArticle} locale="ja" />
			);
			expect(container.querySelector("header")).toBeInTheDocument();
		});

		it("should render time element with correct datetime attribute", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			const timeElement = screen.getByRole("time");
			expect(timeElement).toBeInTheDocument();
			expect(timeElement).toHaveAttribute("dateTime", "2024-01-15T10:00:00Z");
		});
	});
});

describe("Unit Test - Chat panel portal integration", () => {
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

	it("should not call setChatNode when chat is closed", () => {
		// Given: チャットが閉じている初期状態
		mockSetChatNode.mockClear();
		render(<ArticleDetailView article={mockArticle} locale="ja" />);

		// Then: setChatNodeがnullで呼ばれる（初期状態のクリーンアップ以外で非null値は渡されない）
		// useEffectの初回実行で setChatNode(null) が呼ばれる
		expect(mockSetChatNode).toHaveBeenCalledWith(null);
	});

	it("should call setChatNode with chat panel when chat button is clicked", async () => {
		// Given: 記事詳細ビューが表示されている
		mockSetChatNode.mockClear();
		const user = userEvent.setup();
		render(<ArticleDetailView article={mockArticle} locale="ja" />);

		// When: チャットボタンをクリック
		const chatButton = screen.getByRole("button", {
			name: "記事について質問",
		});
		await user.click(chatButton);

		// Then: setChatNodeが非nullのReactNodeで呼ばれる（チャットパネルが登録される）
		const lastCall =
			mockSetChatNode.mock.calls[mockSetChatNode.mock.calls.length - 1];
		expect(lastCall[0]).not.toBeNull();
	});

	it("should not render chat panel directly in its own DOM", async () => {
		// Given: 記事詳細ビューが表示されている
		const user = userEvent.setup();
		render(<ArticleDetailView article={mockArticle} locale="ja" />);

		// When: チャットボタンをクリック
		const chatButton = screen.getByRole("button", {
			name: "記事について質問",
		});
		await user.click(chatButton);

		// Then: チャットパネルは直接レンダリングされない（レイアウト側で表示される）
		expect(screen.queryByTestId("chat-panel")).not.toBeInTheDocument();
	});

	it("should not have inline marginRight or margin-related CSS variable logic", () => {
		// Given: チャットが閉じている状態
		render(<ArticleDetailView article={mockArticle} locale="ja" />);

		// Then: コンテナにインラインのmarginRightやtransition-[margin]が設定されていない
		const container = screen.getByRole("article").parentElement;
		expect(container?.style.marginRight).toBe("");
		expect(container?.className).not.toContain("transition-[margin]");
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
			viewCount: 42,
			tags: [],
		};

		it("should render complete article layout with Japanese locale", () => {
			render(<ArticleDetailView article={mockArticle} locale="ja" />);

			// 全体の構造が正しく表示されることを確認
			expect(screen.getByRole("article")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
			expect(screen.getByTestId("markdown-content")).toBeInTheDocument();

			expect(screen.getByText(/2024年1月15日/)).toBeInTheDocument();
		});

		it("should render complete article layout with English locale", () => {
			mockLocale = "en";
			render(<ArticleDetailView article={mockArticle} locale="en" />);

			// 全体の構造が正しく表示されることを確認
			expect(screen.getByRole("article")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
			expect(screen.getByTestId("markdown-content")).toBeInTheDocument();

			// 英語ロケール固有の表示確認
			expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
			mockLocale = "ja"; // Reset to default
		});
	});
});
