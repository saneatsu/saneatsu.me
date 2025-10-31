import type { Meta, StoryObj } from "@storybook/nextjs";
import { siNextdotjs, siReact, siTypescript } from "simple-icons";
import { within } from "storybook/test";

import { StepperTimeline } from "./stepper-timeline";

const meta = {
	component: StepperTimeline,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
} satisfies Meta<typeof StepperTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 複数のアイテムを持つデフォルトのタイムライン
 *
 * 3つのタイムラインアイテムを表示。
 * stepperizeを使用して管理されている。
 * 新しい順（最新が上）で表示される。
 */
export const デフォルト: Story = {
	tags: ["code-only"],
	args: {
		items: [
			{
				period: {
					start: "2024-01",
					end: null,
				},
				title: "個人ブログサイトの開発",
				description:
					"Next.js と TypeScript を使用した個人ブログサイトを開発。Cloudflare へのデプロイ、記事管理機能、国際化対応などを実装。",
				category: "project",
				techStack: [siReact, siNextdotjs, siTypescript],
			},
			{
				period: {
					start: "2023",
					end: "2023",
				},
				title: "フルスタック開発の学習",
				description:
					"React、Next.js、TypeScript、Node.js などのモダンな Web 技術スタックを習得。Feature-Sliced Design などの設計手法も学習。",
				category: "skill",
			},
			{
				period: {
					start: "2022",
					end: "2023",
				},
				title: "ポートフォリオサイトの開発",
				description:
					"自身の技術スタックやプロジェクトを紹介するポートフォリオサイトを作成。レスポンシブデザインとアクセシビリティを重視。",
				category: "project",
			},
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 3つのアイテムがすべて表示されていることを確認
		await canvas.findByText("個人ブログサイトの開発");
		await canvas.findByText("フルスタック開発の学習");
		await canvas.findByText("ポートフォリオサイトの開発");

		// 最新のアイテムに「現在」が表示されていることを確認
		await canvas.findByText("2024-01 - 現在");
	},
};

/**
 * 1つだけのアイテムを持つタイムライン
 *
 * 単一のタイムラインアイテムを表示。
 * stepperizeで管理されるが、ステップが1つだけの場合。
 */
export const 単一アイテム: Story = {
	tags: ["code-only"],
	args: {
		items: [
			{
				period: {
					start: "2024-01",
					end: null,
				},
				title: "個人ブログサイトの開発",
				description:
					"Next.js と TypeScript を使用した個人ブログサイトを開発。Cloudflare へのデプロイ、記事管理機能、国際化対応などを実装。",
				category: "project",
			},
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// アイテムが表示されていることを確認
		await canvas.findByText("個人ブログサイトの開発");
	},
};

/**
 * 空のタイムライン
 *
 * アイテムが空の配列の場合、何も表示されない。
 */
export const 空: Story = {
	tags: ["code-only"],
	args: {
		items: [],
	},
	render: ({ items }) => {
		const result = <StepperTimeline items={items} />;

		// 空の場合はnullが返されるため、説明テキストを表示
		if (result === null) {
			return <div className="text-muted-foreground">アイテムがありません</div>;
		}

		return result;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 空の場合の説明テキストが表示されていることを確認
		await canvas.findByText("アイテムがありません");
	},
};
