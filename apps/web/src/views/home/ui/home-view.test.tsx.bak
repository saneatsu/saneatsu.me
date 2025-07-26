import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeView } from "./home-view";

// ArticlesListのモック
vi.mock("../../../widgets/articles-list", () => ({
	ArticlesList: () => <div data-testid="articles-list">記事一覧</div>,
}));

describe("Unit Test", () => {
	describe("HomeView", () => {
		it("should render hero section with correct heading and description", () => {
			render(<HomeView />);

			// ヒーローセクションのタイトルが表示されることを確認
			expect(
				screen.getByRole("heading", { level: 1, name: "Saneatsu Blog" })
			).toBeInTheDocument();

			// ヒーローセクションの説明文が表示されることを確認
			expect(
				screen.getByText(
					"技術とライフスタイルに関する記事を発信しています。プログラミング、開発ツール、日常の気づきなど、さまざまなトピックを扱います。"
				)
			).toBeInTheDocument();
		});

		it("should render articles list component", () => {
			render(<HomeView />);

			// ArticlesListコンポーネントが表示されることを確認
			expect(screen.getByTestId("articles-list")).toBeInTheDocument();
		});

		it("should have proper semantic structure", () => {
			render(<HomeView />);

			// main要素が存在することを確認
			const main = screen.getByRole("main");
			expect(main).toBeInTheDocument();
			expect(main).toHaveClass(
				"container",
				"mx-auto",
				"px-4",
				"py-8",
				"space-y-12"
			);
		});

		it("should render hero section within proper section element", () => {
			const { container } = render(<HomeView />);

			// ヒーローセクションがsection要素内にあることを確認
			const heroSection = container.querySelector("section");
			expect(heroSection).toBeInTheDocument();
			expect(heroSection).toHaveClass("text-center", "space-y-4");
		});
	});
});

describe("Integration Test", () => {
	describe("HomeView with dependencies", () => {
		it("should render complete home page layout", () => {
			render(<HomeView />);

			// ページ全体の構造が正しく表示されることを確認
			expect(screen.getByRole("main")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
			expect(screen.getByTestId("articles-list")).toBeInTheDocument();
		});
	});
});
