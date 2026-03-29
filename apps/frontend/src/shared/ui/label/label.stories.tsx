import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "storybook/test";

import { Label } from "./label";

const meta = {
	component: Label,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<div className="p-4 max-w-md">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトのラベル表示
 */
export const Default: Story = {
	name: "デフォルト",
	tags: ["code-only"],
	args: {
		children: "ラベルテキスト",
	},
};

/**
 * required propがtrueの場合、「必須」バッジが表示される
 */
export const Required: Story = {
	name: "必須バッジ付き",
	args: {
		children: "メールアドレス",
		required: true,
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// ラベルテキストが表示されていることを確認
		const label = canvas.getByText("メールアドレス");
		expect(label).toBeInTheDocument();

		// 「必須」バッジが表示されていることを確認
		const requiredBadge = canvas.getByText("必須");
		expect(requiredBadge).toBeInTheDocument();
		expect(requiredBadge).toHaveClass("text-destructive");
	},
};

/**
 * required propがfalseまたは未指定の場合、「必須」バッジは表示されない
 */
export const NotRequired: Story = {
	name: "必須バッジなし",
	args: {
		children: "備考",
		required: false,
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// ラベルテキストが表示されていることを確認
		const label = canvas.getByText("備考");
		expect(label).toBeInTheDocument();

		// 「必須」バッジが表示されていないことを確認
		const requiredBadge = canvas.queryByText("必須");
		expect(requiredBadge).not.toBeInTheDocument();
	},
};
