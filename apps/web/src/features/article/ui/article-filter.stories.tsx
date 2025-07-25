import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, userEvent, within } from "@storybook/test";
import type { Tag } from "../../../shared";
import { ArticleFilter } from "./article-filter";

const meta: Meta<typeof ArticleFilter> = {
	component: ArticleFilter,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// テスト用のモックタグデータ
const mockTags: Tag[] = [
	{ id: 1, name: "React", slug: "react" },
	{ id: 2, name: "TypeScript", slug: "typescript" },
	{ id: 3, name: "Next.js", slug: "nextjs" },
	{ id: 4, name: "TailwindCSS", slug: "tailwindcss" },
];

/**
 * 基本的な表示確認用のStory
 */
export const 基本表示: Story = {
	name: "基本表示",
	tags: ["code-only"],
	args: {
		tags: mockTags,
		onTagSelect: fn(),
		onStatusSelect: fn(),
	},
	parameters: {},
};

/**
 * フィルター機能の包括的なテスト
 */
export const フィルター機能テスト: Story = {
	name: "フィルター機能テスト",
	tags: ["validation"],
	args: {
		tags: mockTags,
		onTagSelect: fn(),
		onStatusSelect: fn(),
	},
	parameters: {},
	play: async ({ canvasElement, args }: any) => {
		const canvas = within(canvasElement);

		// 1. 基本要素の存在確認
		const tagSelect = canvas.getByLabelText("タグで絞り込み");
		const statusSelect = canvas.getByLabelText("ステータスで絞り込み");

		expect(tagSelect).toBeInTheDocument();
		expect(statusSelect).toBeInTheDocument();

		// 2. タグフィルターのテスト
		await userEvent.selectOptions(tagSelect, "1");
		expect(args.onTagSelect).toHaveBeenCalledWith(1);

		// 3. ステータスフィルターのテスト
		await userEvent.selectOptions(statusSelect, "published");
		expect(args.onStatusSelect).toHaveBeenCalledWith("published");

		// 4. "すべてのタグ"選択時のテスト
		await userEvent.selectOptions(tagSelect, "");
		expect(args.onTagSelect).toHaveBeenCalledWith(undefined);

		// 5. すべてのタグオプションが表示されることを確認
		for (const tag of mockTags) {
			const option = canvas.getByRole("option", { name: tag.name });
			expect(option).toBeInTheDocument();
		}
	},
};

/**
 * 選択済み状態のテスト
 */
export const 選択済み状態: Story = {
	name: "選択済み状態",
	tags: ["validation"],
	args: {
		tags: mockTags,
		selectedTagId: 2,
		selectedStatus: "published",
		onTagSelect: fn(),
		onStatusSelect: fn(),
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// 選択済み状態の確認
		const tagSelect = canvas.getByLabelText(
			"タグで絞り込み"
		) as HTMLSelectElement;
		const statusSelect = canvas.getByLabelText(
			"ステータスで絞り込み"
		) as HTMLSelectElement;

		expect(tagSelect.value).toBe("2");
		expect(statusSelect.value).toBe("published");

		// クリアボタンが表示されることを確認
		const clearButton = canvas.getByRole("button", {
			name: "フィルターをクリア",
		});
		expect(clearButton).toBeInTheDocument();
	},
};

/**
 * フィルタークリア機能のテスト
 */
export const フィルタークリア機能: Story = {
	name: "フィルタークリア機能",
	tags: ["validation"],
	args: {
		tags: mockTags,
		selectedTagId: 1,
		selectedStatus: "draft",
		onTagSelect: fn(),
		onStatusSelect: fn(),
	},
	parameters: {},
	play: async ({ canvasElement, args }: any) => {
		const canvas = within(canvasElement);

		// クリアボタンの存在確認
		const clearButton = canvas.getByRole("button", {
			name: "フィルターをクリア",
		});
		expect(clearButton).toBeInTheDocument();

		// クリアボタンクリック
		await userEvent.click(clearButton);

		// クリア時のコールバック確認
		expect(args.onTagSelect).toHaveBeenCalledWith(undefined);
		expect(args.onStatusSelect).toHaveBeenCalledWith("all");
	},
};

/**
 * 空のタグリストでの表示確認
 */
export const 空のタグリスト: Story = {
	name: "空のタグリスト",
	tags: ["code-only"],
	args: {
		tags: [],
		onTagSelect: fn(),
		onStatusSelect: fn(),
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// タグセレクトには"すべてのタグ"オプションのみが存在することを確認
		const tagSelect = canvas.getByLabelText("タグで絞り込み");
		const options = tagSelect.querySelectorAll("option");
		expect(options).toHaveLength(1);
		expect(options[0]).toHaveTextContent("すべてのタグ");
	},
};

/**
 * レスポンシブ表示の確認
 */
export const モバイル表示: Story = {
	name: "モバイル表示",
	tags: ["code-only"],
	args: {
		tags: mockTags,
		onTagSelect: fn(),
		onStatusSelect: fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

/**
 * クリアボタン非表示の確認
 */
export const クリアボタン非表示: Story = {
	name: "クリアボタン非表示",
	tags: ["validation"],
	args: {
		tags: mockTags,
		onTagSelect: fn(),
		onStatusSelect: fn(),
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// デフォルト状態ではクリアボタンが表示されないことを確認
		const clearButton = canvas.queryByRole("button", {
			name: "フィルターをクリア",
		});
		expect(clearButton).not.toBeInTheDocument();
	},
};
