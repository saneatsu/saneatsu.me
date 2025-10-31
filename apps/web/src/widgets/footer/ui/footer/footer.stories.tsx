import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "storybook/test";

import { Footer } from "./footer";

const meta: Meta<typeof Footer> = {
	component: Footer,
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
 * Privacyリンクが正しいhrefを持つ
 */
export const PrivacyLink: Story = {
	name: "Privacyリンクが正しいhrefを持つ",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Privacyリンクを取得（日本語の名前で検索）
		const privacyLink = canvas.getByRole("link", { name: /プライバシー/i });

		// href が "/ja/privacy" であることを確認（next-intlが自動的にロケールを追加）
		expect(privacyLink).toHaveAttribute("href", "/ja/privacy");
	},
};

/**
 * Termsリンクが正しいhrefを持つ
 */
export const TermsLink: Story = {
	name: "Termsリンクが正しいhrefを持つ",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Termsリンクを取得（日本語の名前で検索）
		const termsLink = canvas.getByRole("link", { name: /利用規約/i });

		// href が "/ja/terms" であることを確認（next-intlが自動的にロケールを追加）
		expect(termsLink).toHaveAttribute("href", "/ja/terms");
	},
};

/**
 * コピーライト表示が正しいテキストを持つ
 */
export const CopyrightText: Story = {
	name: "コピーライト表示が正しいテキストを持つ",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 現在の年を取得
		const currentYear = new Date().getFullYear();

		// コピーライトテキストを確認
		const copyrightText = canvas.getByText(
			`© ${currentYear} Saneatsu WAKANA. All rights reserved.`
		);
		expect(copyrightText).toBeInTheDocument();
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

		await step("Privacyリンクのhrefを確認", async () => {
			const privacyLink = canvas.getByRole("link", { name: /プライバシー/i });
			expect(privacyLink).toHaveAttribute("href", "/ja/privacy");
		});

		await step("Termsリンクのhrefを確認", async () => {
			const termsLink = canvas.getByRole("link", { name: /利用規約/i });
			expect(termsLink).toHaveAttribute("href", "/ja/terms");
		});

		await step("コピーライト表示を確認", async () => {
			const currentYear = new Date().getFullYear();
			const copyrightText = canvas.getByText(
				`© ${currentYear} Saneatsu WAKANA. All rights reserved.`
			);
			expect(copyrightText).toBeInTheDocument();
		});
	},
};
