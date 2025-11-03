import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "storybook/test";

import type { HeadingItem } from "@/shared/lib";

import { TableOfContents } from "./table-of-contents";

const meta: Meta<typeof TableOfContents> = {
	component: TableOfContents,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * テスト用のサンプル見出しデータ
 */
const sampleHeadings: HeadingItem[] = [
	{ id: "introduction", text: "はじめに", level: 1 },
	{ id: "installation", text: "インストール", level: 2 },
	{ id: "requirements", text: "必要な環境", level: 3 },
	{ id: "usage", text: "使い方", level: 2 },
	{ id: "examples", text: "サンプルコード", level: 3 },
	{ id: "conclusion", text: "まとめ", level: 1 },
];

/**
 * 基本的な目次の表示
 */
export const Default: Story = {
	name: "基本的な表示",
	tags: ["code-only"],
	args: {
		headings: sampleHeadings,
		title: "目次",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Should render the title
		const titleElement = canvas.getByRole("heading", { name: "目次" });
		expect(titleElement).toBeInTheDocument();

		// Should render all heading items
		expect(
			canvas.getByRole("button", { name: "はじめに" })
		).toBeInTheDocument();
		expect(
			canvas.getByRole("button", { name: "インストール" })
		).toBeInTheDocument();
		expect(
			canvas.getByRole("button", { name: "必要な環境" })
		).toBeInTheDocument();
		expect(canvas.getByRole("button", { name: "使い方" })).toBeInTheDocument();
		expect(
			canvas.getByRole("button", { name: "サンプルコード" })
		).toBeInTheDocument();
		expect(canvas.getByRole("button", { name: "まとめ" })).toBeInTheDocument();
	},
};

/**
 * カスタムタイトルの表示
 */
export const CustomTitle: Story = {
	name: "カスタムタイトル",
	tags: ["code-only"],
	args: {
		headings: sampleHeadings,
		title: "この記事の内容",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Should render custom title
		const titleElement = canvas.getByRole("heading", {
			name: "この記事の内容",
		});
		expect(titleElement).toBeInTheDocument();
	},
};

/**
 * 見出しが空の場合
 * タイトルは表示されるが、中身には「見出しなし」と表示される
 */
export const EmptyHeadings: Story = {
	name: "見出しが空の場合",
	tags: ["validation"],
	args: {
		headings: [],
		title: "目次",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Should render the title even when headings are empty
		const titleElement = canvas.getByRole("heading", { name: "目次" });
		expect(titleElement).toBeInTheDocument();

		// Should display "見出しなし" message
		const emptyMessage = canvas.getByText("見出しなし");
		expect(emptyMessage).toBeInTheDocument();

		// Should not render any heading buttons
		const buttons = canvas.queryAllByRole("button");
		expect(buttons).toHaveLength(0);
	},
};

/**
 * アクティブな見出しのハイライト
 */
export const WithActiveHeading: Story = {
	name: "アクティブな見出し",
	tags: ["code-only"],
	args: {
		headings: sampleHeadings,
		title: "目次",
		activeId: "installation",
	},
};
