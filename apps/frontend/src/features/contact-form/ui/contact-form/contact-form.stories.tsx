import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, userEvent, within } from "storybook/test";

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
			canvas.getByText("会社名を入力してください")
		).toBeInTheDocument();
		await expect(
			canvas.getByText("メールアドレスを入力してください")
		).toBeInTheDocument();
		await expect(
			canvas.getByText("件名を入力してください")
		).toBeInTheDocument();
		// カテゴリのエラーメッセージはplaceholderと同じテキストのため、
		// 複数存在することを検証する
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

/**
 * 送信成功フロー
 *
 * fetchをモックして送信成功をシミュレーションする。
 * beforeEachでwindow.fetchをスパイに差し替え、テスト後にリストアする。
 */
export const SubmitSuccess: Story = {
	name: "送信成功フロー",
	tags: ["validation"],
	beforeEach: () => {
		const originalFetch = window.fetch;
		// no-corsのfetchは常にopaqueレスポンスを返すため、空のResponseで模倣
		window.fetch = fn().mockResolvedValue(new Response());
		return () => {
			window.fetch = originalFetch;
		};
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// When: 全フィールドに有効な値を入力
		await user.type(canvas.getByLabelText("お名前"), "テスト太郎");
		await user.type(canvas.getByLabelText("会社名"), "テスト株式会社");
		await user.type(
			canvas.getByLabelText("メールアドレス"),
			"test@example.com"
		);
		await user.type(canvas.getByLabelText("件名"), "テストの件名");

		// カテゴリを選択
		const categoryTrigger = canvas.getByRole("combobox");
		await user.click(categoryTrigger);
		// SelectContentはPortalで描画されるためdocument.bodyからrole="option"で取得
		const option = await within(document.body).findByRole("option", {
			name: "一般的なお問い合わせ",
		});
		await user.click(option);

		await user.type(
			canvas.getByLabelText("メッセージ"),
			"テストメッセージです。"
		);

		// When: 送信ボタンをクリック
		const submitButton = canvas.getByRole("button", { name: /送信する/ });
		await user.click(submitButton);

		// Then: 送信成功後、ボタンが「送信しました」に変わる
		await expect(
			canvas.getByRole("button", { name: /送信しました/ })
		).toBeInTheDocument();

		// Then: フォームがリセットされている（名前フィールドが空）
		const nameInput = canvas.getByLabelText("お名前");
		await expect(nameInput).toHaveValue("");

		// Then: 会社名フィールドも空
		const companyInput = canvas.getByLabelText("会社名");
		await expect(companyInput).toHaveValue("");
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
