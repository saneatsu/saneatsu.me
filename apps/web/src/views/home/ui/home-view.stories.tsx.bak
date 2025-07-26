import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";
import { HomeView } from "./home-view";

const meta: Meta<typeof HomeView> = {
	component: HomeView,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的な表示確認用のStory
 */
export const 基本表示: Story = {
	name: "基本表示",
	tags: ["code-only"],
	args: {},
	parameters: {},
};

/**
 * ヒーローセクションのテスト
 */
export const ヒーローセクション確認: Story = {
	name: "ヒーローセクション確認",
	tags: ["validation"],
	args: {},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// メインタイトルの確認
		const mainTitle = canvas.getByRole("heading", { level: 1 });
		expect(mainTitle).toBeInTheDocument();
		expect(mainTitle).toHaveTextContent("Saneatsu Blog");

		// 説明文の確認
		const description = canvas.getByText(/技術とライフスタイルに関する記事/);
		expect(description).toBeInTheDocument();

		// main要素の存在確認
		const mainElement = canvas.getByRole("main");
		expect(mainElement).toBeInTheDocument();
		expect(mainElement).toHaveClass(
			"container",
			"mx-auto",
			"px-4",
			"py-8",
			"space-y-12"
		);
	},
};

/**
 * セマンティック構造の確認
 */
export const セマンティック構造確認: Story = {
	name: "セマンティック構造確認",
	tags: ["validation"],
	args: {},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// main要素の確認
		const mainElement = canvas.getByRole("main");
		expect(mainElement).toBeInTheDocument();

		// ヒーローセクションの確認
		const heroSection = mainElement.querySelector("section");
		expect(heroSection).toBeInTheDocument();

		// h1要素の確認
		const h1 = canvas.getByRole("heading", { level: 1 });
		expect(h1).toBeInTheDocument();

		// 記事セクションの確認（ArticlesListを含む）
		const articlesSections = mainElement.querySelectorAll("section");
		expect(articlesSections).toHaveLength(2); // ヒーローセクション + 記事セクション
	},
};

/**
 * レスポンシブ表示の確認
 */
export const モバイル表示: Story = {
	name: "モバイル表示",
	tags: ["code-only"],
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

/**
 * タブレット表示の確認
 */
export const タブレット表示: Story = {
	name: "タブレット表示",
	tags: ["code-only"],
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

/**
 * アクセシビリティの確認
 */
export const アクセシビリティ確認: Story = {
	name: "アクセシビリティ確認",
	tags: ["validation"],
	args: {},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// ランドマークの確認
		const main = canvas.getByRole("main");
		expect(main).toBeInTheDocument();

		// 見出し階層の確認
		const h1 = canvas.getByRole("heading", { level: 1 });
		expect(h1).toBeInTheDocument();

		// ヒーローセクションのテキストがアクセシブルであることを確認
		const description = canvas.getByText(/技術とライフスタイルに関する記事/);
		expect(description).toBeInTheDocument();
	},
};
