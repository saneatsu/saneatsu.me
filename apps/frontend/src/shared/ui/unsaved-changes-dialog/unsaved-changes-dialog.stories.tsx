import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, screen, userEvent, within } from "storybook/test";

import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

const meta: Meta<typeof UnsavedChangesDialog> = {
	component: UnsavedChangesDialog,
	args: {
		onCancel: fn(),
		onConfirm: fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ダイアログ非表示
 */
export const Closed: Story = {
	name: "デフォルト（非表示）",
	tags: ["validation"],
	args: {
		open: false,
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("ダイアログが表示されていない", async () => {
			const dialog = canvas.queryByRole("alertdialog");
			expect(dialog).toBeNull();
		});
	},
};

/**
 * ダイアログ表示
 */
export const Open: Story = {
	name: "ダイアログ表示",
	tags: ["validation"],
	args: {
		open: true,
	},
	play: async ({ step }) => {
		await step("ダイアログが表示される", async () => {
			const dialog = await screen.findByRole("alertdialog");
			expect(dialog).toBeInTheDocument();
		});

		await step("タイトルと説明が表示される", async () => {
			expect(screen.getByText("変更が保存されていません")).toBeInTheDocument();
			expect(
				screen.getByText(
					"保存されていない変更があります。このページを離れると変更内容は失われます。"
				)
			).toBeInTheDocument();
		});

		await step("キャンセルボタンと変更を破棄ボタンが表示される", async () => {
			expect(screen.getByText("キャンセル")).toBeInTheDocument();
			expect(screen.getByText("変更を破棄")).toBeInTheDocument();
		});
	},
};

/**
 * キャンセルボタンのクリック
 */
export const CancelClick: Story = {
	name: "キャンセルボタンクリック",
	tags: ["validation"],
	args: {
		open: true,
	},
	play: async ({ args, step }) => {
		await step("ダイアログが表示されている", async () => {
			await screen.findByRole("alertdialog");
		});

		await step(
			"キャンセルボタンをクリックすると onCancel が呼ばれる",
			async () => {
				await userEvent.click(screen.getByText("キャンセル"));
				expect(args.onCancel).toHaveBeenCalled();
			}
		);
	},
};

/**
 * 変更を破棄ボタンのクリック
 */
export const ConfirmClick: Story = {
	name: "変更を破棄ボタンクリック",
	tags: ["validation"],
	args: {
		open: true,
	},
	play: async ({ args, step }) => {
		await step("ダイアログが表示されている", async () => {
			await screen.findByRole("alertdialog");
		});

		await step(
			"変更を破棄ボタンをクリックすると onConfirm が呼ばれる",
			async () => {
				await userEvent.click(screen.getByText("変更を破棄"));
				expect(args.onConfirm).toHaveBeenCalled();
			}
		);
	},
};
