import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, userEvent, within } from "@storybook/test";
import { ArticleSearch } from "./article-search";

const meta: Meta<typeof ArticleSearch> = {
	component: ArticleSearch,
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
	args: {
		onSearch: fn(),
	},
	parameters: {},
};

/**
 * 検索機能の包括的なテスト
 */
export const 検索機能テスト: Story = {
	name: "検索機能テスト",
	tags: ["validation"],
	args: {
		onSearch: fn(),
		placeholder: "記事を検索...",
	},
	parameters: {},
	play: async ({ canvasElement, args }: any) => {
		const canvas = within(canvasElement);

		// 1. 基本要素の存在確認
		const input = canvas.getByRole("textbox");
		const searchButton = canvas.getByRole("button", { name: "検索" });
		expect(input).toBeInTheDocument();
		expect(searchButton).toBeInTheDocument();

		// 2. プレースホルダーテキストの確認
		expect(input).toHaveAttribute("placeholder", "記事を検索...");

		// 3. テキスト入力のテスト
		await userEvent.type(input, "React Hooks");
		expect(input).toHaveValue("React Hooks");

		// 4. 検索ボタンクリックのテスト
		await userEvent.click(searchButton);
		expect(args.onSearch).toHaveBeenCalledWith("React Hooks");

		// 5. フォーム送信（Enter押下）のテスト
		await userEvent.clear(input);
		await userEvent.type(input, "TypeScript");
		await userEvent.keyboard("{Enter}");
		expect(args.onSearch).toHaveBeenCalledWith("TypeScript");

		// 6. 空白のトリミングテスト
		await userEvent.clear(input);
		await userEvent.type(input, "  Next.js  ");
		await userEvent.click(searchButton);
		expect(args.onSearch).toHaveBeenCalledWith("Next.js");
	},
};

/**
 * 初期値設定のテスト
 */
export const 初期値設定: Story = {
	name: "初期値設定",
	tags: ["validation"],
	args: {
		onSearch: fn(),
		initialQuery: "初期検索クエリ",
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// 初期値が正しく設定されていることを確認
		const input = canvas.getByRole("textbox");
		expect(input).toHaveValue("初期検索クエリ");
	},
};

/**
 * ローディング状態のテスト
 */
export const ローディング状態: Story = {
	name: "ローディング状態",
	tags: ["validation"],
	args: {
		onSearch: fn(),
		isLoading: true,
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// ローディング時の状態確認
		const input = canvas.getByRole("textbox");
		const loadingButton = canvas.getByRole("button", { name: "..." });

		expect(input).toBeDisabled();
		expect(loadingButton).toBeDisabled();
		expect(loadingButton).toHaveTextContent("...");
	},
};

/**
 * 空文字検索のテスト
 */
export const 空文字検索テスト: Story = {
	name: "空文字検索テスト",
	tags: ["validation"],
	args: {
		onSearch: fn(),
	},
	parameters: {},
	play: async ({ canvasElement, args }: any) => {
		const canvas = within(canvasElement);

		// 1. 空文字での検索
		const searchButton = canvas.getByRole("button", { name: "検索" });
		await userEvent.click(searchButton);
		expect(args.onSearch).toHaveBeenCalledWith("");

		// 2. 空白文字のみでの検索（トリミングされて空文字になる）
		const input = canvas.getByRole("textbox");
		await userEvent.type(input, "   ");
		await userEvent.click(searchButton);
		expect(args.onSearch).toHaveBeenCalledWith("");
	},
};

/**
 * SVGアイコンの存在確認
 */
export const アイコン表示確認: Story = {
	name: "アイコン表示確認",
	tags: ["code-only"],
	args: {
		onSearch: fn(),
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// SVGアイコンの存在確認
		const svgIcon = canvas.getByRole("img", { name: "検索" });
		expect(svgIcon).toBeInTheDocument();
	},
};
