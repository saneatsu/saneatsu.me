import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";

import type { Article } from "@/shared";

import { ArticleCard } from "./article-card";

const meta = {
	component: ArticleCard,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
} satisfies Meta<typeof ArticleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 記事カードのベースデータ
 */
const baseArticle: Article = {
	id: 1,
	slug: "test-article",
	title: "テスト記事のタイトル",
	content:
		"# テスト記事\n\nこれはテスト記事の内容です。```js\nconst test = 'code';\n```\n\nマークダウン記法を含む内容をテストします。",
	publishedAt: "2024-01-15T10:00:00.000Z",
	updatedAt: "2024-01-20T15:30:00.000Z",
	viewCount: 42,
	status: "published" as const,
	cfImageId: null,
	tags: [],
};

export const Default: Story = {
	name: "デフォルト表示",
	args: {
		article: baseArticle,
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タイトルが表示されていることを確認
		const title = canvas.getByText("テスト記事のタイトル");
		expect(title).toBeInTheDocument();

		// 本文の抜粋が表示されていることを確認
		const excerpt = canvas.getByText(/これはテスト記事の内容です/);
		expect(excerpt).toBeInTheDocument();

		// 更新日が表示されていることを確認
		const updatedLabel = canvas.getByText(/更新日:|Updated:/);
		expect(updatedLabel).toBeInTheDocument();

		// 閲覧数が表示されていることを確認
		const viewCount = canvas.getByText(/42 回閲覧|Viewed 42 times/);
		expect(viewCount).toBeInTheDocument();
	},
};

export const UpdatedToday: Story = {
	name: "更新日が今日の場合",
	tags: ["validation"],
	args: {
		article: {
			...baseArticle,
			updatedAt: new Date().toISOString(),
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「今日」が表示されていることを確認
		const todayText = canvas.getByText(/今日|Today/);
		expect(todayText).toBeInTheDocument();
	},
};

export const Updated1DayAgo: Story = {
	name: "更新日が1日前の場合",
	tags: ["validation"],
	args: {
		article: {
			...baseArticle,
			updatedAt: (() => {
				const date = new Date();
				date.setDate(date.getDate() - 1);
				return date.toISOString();
			})(),
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「1日前」が表示されていることを確認
		const daysAgoText = canvas.getByText(/1日前|1 days ago/);
		expect(daysAgoText).toBeInTheDocument();
	},
};

export const Updated5DaysAgo: Story = {
	name: "更新日が5日前の場合",
	tags: ["validation"],
	args: {
		article: {
			...baseArticle,
			updatedAt: (() => {
				const date = new Date();
				date.setDate(date.getDate() - 5);
				return date.toISOString();
			})(),
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「5日前」が表示されていることを確認
		const daysAgoText = canvas.getByText(/5日前|5 days ago/);
		expect(daysAgoText).toBeInTheDocument();
	},
};

export const Updated10DaysAgo: Story = {
	name: "更新日が10日前の場合（境界値）",
	tags: ["validation"],
	args: {
		article: {
			...baseArticle,
			updatedAt: (() => {
				const date = new Date();
				date.setDate(date.getDate() - 10);
				return date.toISOString();
			})(),
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「10日前」が表示されていることを確認
		const daysAgoText = canvas.getByText(/10日前|10 days ago/);
		expect(daysAgoText).toBeInTheDocument();
	},
};

export const Updated15DaysAgo: Story = {
	name: "更新日が15日前の場合（通常の日付形式）",
	tags: ["validation"],
	args: {
		article: {
			...baseArticle,
			updatedAt: "2024-01-01T10:00:00.000Z",
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 通常の日付形式で表示されていることを確認
		// （相対表示ではないことを確認）
		const updatedLabel = canvas.getByText(/更新日:|Updated:/);
		expect(updatedLabel).toBeInTheDocument();

		// 「日前」が含まれていないことを確認
		const timeElements = canvas.getAllByText(/2024/);
		const hasRelativeFormat = timeElements.some((el) =>
			el.textContent?.match(/\d+日前|\d+ days ago/)
		);
		expect(hasRelativeFormat).toBe(false);
	},
};

export const NoUpdatedAt: Story = {
	name: "更新日がnullの場合",
	tags: ["validation"],
	args: {
		article: {
			...baseArticle,
			updatedAt: null,
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タイトルは表示されていることを確認
		const title = canvas.getByText("テスト記事のタイトル");
		expect(title).toBeInTheDocument();

		// 更新日は表示されていないことを確認
		const updatedLabels = canvas.queryAllByText(/更新日:|Updated:/);
		expect(updatedLabels.length).toBe(0);
	},
};

export const LongTitle: Story = {
	name: "長いタイトルの記事",
	tags: ["code-only"],
	args: {
		article: {
			...baseArticle,
			title:
				"これは非常に長いタイトルのテストです。タイトルが長い場合、適切に省略されて表示されることを確認します。",
		},
	},
};

export const LongContent: Story = {
	name: "長い本文の記事",
	tags: ["code-only"],
	args: {
		article: {
			...baseArticle,
			content:
				"これは非常に長い本文のテストです。".repeat(50) +
				" 本文が長い場合、適切に省略されて表示されることを確認します。",
		},
	},
};

export const HighViewCount: Story = {
	name: "高い閲覧数の記事",
	tags: ["code-only"],
	args: {
		article: {
			...baseArticle,
			viewCount: 9999,
		},
	},
};
