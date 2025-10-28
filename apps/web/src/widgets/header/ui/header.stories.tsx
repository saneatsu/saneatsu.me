import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";

import { Header } from "./header";

const meta: Meta<typeof Header> = {
	component: Header,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		nextjs: {
			appDirectory: true,
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ホームリンクが正しいhrefを持つ
 *
 * next-intl の Link コンポーネントは自動的にロケールを追加するため、
 * コンポーネントでは href="/" と指定するが、
 * レンダリング後は href="/ja" のようにロケールが追加される
 */
export const HomeLink: Story = {
	name: "ホームリンクが正しいhrefを持つ",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ホームリンク（saneatsu.me）を取得
		// getByTextは<span>を返すので、最も近い<a>タグ（親要素）を取得
		const homeLink = canvas.getByText("saneatsu.me").closest("a");

		// href が "/ja" であることを確認（next-intlが自動的にロケールを追加）
		expect(homeLink).toHaveAttribute("href", "/ja");
	},
};

/**
 * Blogリンクが正しいhrefを持つ
 */
export const BlogLink: Story = {
	name: "Blogリンクが正しいhrefを持つ",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Blogリンクを取得
		const blogLink = canvas.getByText("Blog");

		// href が "/ja/blog" であることを確認（next-intlが自動的にロケールを追加）
		expect(blogLink).toHaveAttribute("href", "/ja/blog");
	},
};

/**
 * Aboutリンクが正しいhrefを持つ
 */
export const AboutLink: Story = {
	name: "Aboutリンクが正しいhrefを持つ",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Aboutリンクを取得
		const aboutLink = canvas.getByText("About");

		// href が "/ja/about" であることを確認（next-intlが自動的にロケールを追加）
		expect(aboutLink).toHaveAttribute("href", "/ja/about");
	},
};

/**
 * すべてのリンクが正しいhrefを持つことを統合的に確認
 */
export const AllLinks: Story = {
	name: "すべてのリンクが正しいhrefを持つ",
	tags: ["validation"],
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("ホームリンクのhrefを確認", async () => {
			const homeLink = canvas.getByText("saneatsu.me").closest("a");
			expect(homeLink).toHaveAttribute("href", "/ja");
		});

		await step("Blogリンクのhrefを確認", async () => {
			const blogLink = canvas.getByText("Blog");
			expect(blogLink).toHaveAttribute("href", "/ja/blog");
		});

		await step("Aboutリンクのhrefを確認", async () => {
			const aboutLink = canvas.getByText("About");
			expect(aboutLink).toHaveAttribute("href", "/ja/about");
		});
	},
};
