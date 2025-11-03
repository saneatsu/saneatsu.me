import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, screen, userEvent, within } from "storybook/test";

import type { ArticleFilters } from "@/shared/model";

import { ArticlesFilter } from "./articles-filter";

const meta: Meta<typeof ArticlesFilter> = {
	component: ArticlesFilter,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<div className="p-4 max-w-4xl">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態（フィルターなし）
 */
export const Default: Story = {
	name: "デフォルト状態",
	tags: ["code-only"],
	args: {
		filters: {
			status: "all",
			language: "ja",
			search: "",
		},
		onFiltersChange: fn(),
		loading: false,
	},
};

/**
 * フィルター適用済み
 */
export const FiltersApplied: Story = {
	name: "フィルター適用済み",
	tags: ["code-only"],
	args: {
		filters: {
			status: "published",
			language: "ja",
			search: "React",
		},
		onFiltersChange: fn(),
		loading: false,
	},
};

/**
 * ローディング状態
 */
export const Loading: Story = {
	name: "ローディング状態",
	tags: ["code-only"],
	args: {
		filters: {
			status: "all",
			language: "ja",
			search: "",
		},
		onFiltersChange: fn(),
		loading: true,
	},
};

/**
 * ステータスフィルター選択
 */
export const StatusFilterSelection: Story = {
	name: "ステータスフィルター選択",
	tags: ["validation"],
	args: {
		filters: {
			status: "all",
			language: "ja",
			search: "",
		},
		onFiltersChange: fn(),
		loading: false,
	},
	play: async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onFiltersChange: (filters: ArticleFilters) => void };
	}) => {
		const canvas = within(canvasElement);

		// ステータスフィルターを開く
		const statusFilter = canvas.getByRole("combobox", { name: /ステータス/i });
		await userEvent.click(statusFilter);

		// 「公開済み」を選択（Portal経由でレンダリングされるためscreenを使用）
		const publishedOption = await screen.findByRole("option", {
			name: /公開済み/i,
		});
		await userEvent.click(publishedOption);

		// onFiltersChangeが呼ばれたことを確認
		await expect(args.onFiltersChange).toHaveBeenCalledWith({
			status: "published",
			language: "ja",
			search: "",
		});
	},
};

/**
 * 検索入力
 */
export const SearchInput: Story = {
	name: "検索入力（Enterキーで実行）",
	tags: ["validation"],
	args: {
		filters: {
			status: "all",
			language: "ja",
			search: "",
		},
		onFiltersChange: fn(),
		loading: false,
	},
	play: async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onFiltersChange: (filters: ArticleFilters) => void };
	}) => {
		const canvas = within(canvasElement);

		// 検索入力欄を見つける
		const searchInput =
			canvas.getByPlaceholderText(/日本語記事のタイトル・内容で検索/i);

		// テキストを入力
		await userEvent.type(searchInput, "TypeScript");

		// Enterキーを押下
		await userEvent.keyboard("{Enter}");

		// onFiltersChangeが呼ばれたことを確認
		await expect(args.onFiltersChange).toHaveBeenCalledWith({
			status: "all",
			language: "ja",
			search: "TypeScript",
		});
	},
};

/**
 * フィルターリセット
 */
export const FilterReset: Story = {
	name: "フィルターリセット",
	tags: ["validation"],
	args: {
		filters: {
			status: "published",
			language: "ja",
			search: "React",
		},
		onFiltersChange: fn(),
		loading: false,
	},
	play: async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onFiltersChange: (filters: ArticleFilters) => void };
	}) => {
		const canvas = within(canvasElement);

		// リセットボタンをクリック
		const resetButton = canvas.getByRole("button", { name: /リセット/i });
		await userEvent.click(resetButton);

		// onFiltersChangeが呼ばれたことを確認
		await expect(args.onFiltersChange).toHaveBeenCalledWith({
			status: "all",
			language: "ja",
			search: "",
		});
	},
};
