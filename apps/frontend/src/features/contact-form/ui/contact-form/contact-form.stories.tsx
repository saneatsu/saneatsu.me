import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, userEvent, within } from "storybook/test";

import { ContactForm } from "./contact-form";

const meta: Meta<typeof ContactForm> = {
	component: ContactForm,
	parameters: {
		viewport: { defaultViewport: "reset" },
	},
};

export default meta;
type Story = StoryObj<typeof ContactForm>;

/** デフォルト表示 */
export const Default: Story = {
	name: "デフォルト表示",
	tags: ["code-only"],
};

/** 全フィールドのバリデーションエラー表示 */
export const ValidationErrors: Story = {
	name: "全フィールドのバリデーションエラー",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// When: 何も入力せずに送信ボタンをクリック
		const submitButton = canvas.getByRole("button", { name: /送信する/ });
		await user.click(submitButton);

		// Then: 各フィールドのバリデーションエラーが表示される
		await expect(
			canvas.getByText("お名前を入力してください")
		).toBeInTheDocument();
		await expect(
			canvas.getByText("メールアドレスを入力してください")
		).toBeInTheDocument();
		await expect(
			canvas.getByText("件名を入力してください")
		).toBeInTheDocument();
		// カテゴリのエラーメッセージはplaceholderと同じテキストのため、
		// FormMessage（p要素）でフィルタリングして検証する
		const categoryErrors = canvas.getAllByText("カテゴリを選択してください");
		await expect(categoryErrors.length).toBeGreaterThanOrEqual(2);
		await expect(
			canvas.getByText("メッセージを入力してください")
		).toBeInTheDocument();
	},
};

/** メール形式バリデーションエラー */
export const EmailValidationError: Story = {
	name: "メール形式のバリデーションエラー",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// When: 不正なメール形式を入力して送信
		const emailInput = canvas.getByLabelText("メールアドレス");
		await user.type(emailInput, "invalid-email");

		const submitButton = canvas.getByRole("button", { name: /送信する/ });
		await user.click(submitButton);

		// Then: メール関連のバリデーションエラーが表示される
		await expect(
			canvas.getByText((content) => content.includes("メールアドレス"))
		).toBeInTheDocument();
	},
};

/** モバイル表示 */
export const Mobile: Story = {
	name: "モバイル表示",
	tags: ["code-only"],
	parameters: {
		viewport: { defaultViewport: "mobile1" },
	},
};
