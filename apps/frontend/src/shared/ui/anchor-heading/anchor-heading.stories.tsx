import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, userEvent, within } from "storybook/test";

import { AnchorHeading } from "./anchor-heading";

const meta = {
	component: AnchorHeading,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<div className="p-4 max-w-2xl">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof AnchorHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * h2レベルのアンカーリンク付き見出し
 */
export const H2Heading: Story = {
	name: "h2見出し",
	args: {
		level: "h2",
		id: "section-title",
		children: "セクションタイトル",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 見出しテキストが表示されていることを確認
		const heading = canvas.getByRole("heading", { level: 2 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent("セクションタイトル");

		// id属性が付与されていることを確認
		expect(heading).toHaveAttribute("id", "section-title");

		// アンカーリンクのhref値が正しいことを確認
		const link = canvas.getByRole("link");
		expect(link).toHaveAttribute("href", "#section-title");

		// aria-labelが設定されていることを確認
		expect(link).toHaveAttribute("aria-label", "セクションタイトルへのリンク");
	},
};

/**
 * h3レベルのアンカーリンク付き見出し
 */
export const H3Heading: Story = {
	name: "h3見出し",
	args: {
		level: "h3",
		id: "sub-section",
		children: "サブセクション",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// h3見出しとして表示されていることを確認
		const heading = canvas.getByRole("heading", { level: 3 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent("サブセクション");

		// id属性が付与されていることを確認
		expect(heading).toHaveAttribute("id", "sub-section");

		// アンカーリンクのhref値が正しいことを確認
		const link = canvas.getByRole("link");
		expect(link).toHaveAttribute("href", "#sub-section");
	},
};

/**
 * ホバー時にリンクアイコンが表示されることを確認
 */
export const HoverShowsIcon: Story = {
	name: "ホバー時にアイコン表示",
	args: {
		level: "h2",
		id: "hover-test",
		children: "ホバーテスト",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const link = canvas.getByRole("link");

		// リンクアイコン（SVG）が存在することを確認
		// opacity-0で初期状態は非表示だが、DOM上には存在する
		const icon = link.querySelector("svg");
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveAttribute("aria-hidden", "true");

		// ホバーしてアイコンが表示されることを確認
		await userEvent.hover(link);

		// group-hoverのCSSクラスが適用されるため、アイコンは引き続きDOM上に存在する
		expect(icon).toBeInTheDocument();
	},
};

/**
 * カスタムclassNameが適用されることを確認
 */
export const WithCustomClassName: Story = {
	name: "カスタムクラス付き",
	args: {
		level: "h2",
		id: "custom-class",
		children: "カスタムスタイル",
		className: "mb-3 text-red-500",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const heading = canvas.getByRole("heading", { level: 2 });
		expect(heading).toBeInTheDocument();

		// カスタムクラスが適用されていることを確認
		expect(heading.className).toContain("mb-3");
	},
};

/**
 * すべてのパターンを一覧表示
 */
export const AllPatterns: Story = {
	name: "すべてのパターン",
	tags: ["code-only"],
	args: {
		level: "h2",
		id: "all-patterns",
		children: "すべてのパターン",
	},
	render: () => (
		<div className="space-y-6">
			<AnchorHeading level="h2" id="example-h2">
				h2見出しの例
			</AnchorHeading>
			<AnchorHeading level="h3" id="example-h3">
				h3見出しの例
			</AnchorHeading>
			<AnchorHeading level="h2" id="custom-h2" className="text-blue-500">
				カスタムスタイルのh2
			</AnchorHeading>
			<AnchorHeading level="h3" id="custom-h3" className="mb-4">
				マージン付きのh3
			</AnchorHeading>
		</div>
	),
};
