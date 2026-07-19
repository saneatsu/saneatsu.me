import type { Meta, StoryObj } from "@storybook/nextjs";

import { PageContainer } from "./page-container";

const meta = {
	component: PageContainer,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
} satisfies Meta<typeof PageContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 主要ページ共通のコンテンツ幅（max-w-5xl）で子要素を表示する基本形。
 * className で縦方向の間隔を渡せることを示す。
 */
export const Default: Story = {
	name: "基本表示（共通のコンテンツ幅）",
	tags: ["code-only"],
	args: {
		className: "space-y-8",
		children: (
			<>
				<div className="h-24 rounded-lg bg-muted" />
				<div className="h-24 rounded-lg bg-muted" />
			</>
		),
	},
};
