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
		presentLabel: "現在",
		items: [
			{
				slug: "personal-blog",
				period: {
					from: "2024-01",
					to: null,
				},
				companyName: "個人ブログサイトの開発",
				description:
					"Next.js と TypeScript を使用した個人ブログサイトを開発。Cloudflare へのデプロイ、記事管理機能、国際化対応などを実装。",
				category: "project",
				techStack: [siReact, siNextdotjs, siTypescript],
			},
			{
				slug: "fullstack-learning",
				period: {
					from: "2023",
					to: "2023",
				},
				companyName: "フルスタック開発の学習",
				description:
					"React、Next.js、TypeScript、Node.js などのモダンな Web 技術スタックを習得。Feature-Sliced Design などの設計手法も学習。",
				category: "skill",
			},
			{
				slug: "portfolio-site",
				period: {
					from: "2022",
					to: "2023",
				},
				companyName: "ポートフォリオサイトの開発",
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
		presentLabel: "現在",
		items: [
			{
				slug: "personal-blog",
				period: {
					from: "2024-01",
					to: null,
				},
				companyName: "個人ブログサイトの開発",
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
		presentLabel: "現在",
		items: [],
	},
	render: ({ items }) => {
		// 空の場合は説明テキストを表示
		if (items.length === 0) {
			return <div className="text-muted-foreground">アイテムがありません</div>;
		}

		return <StepperTimeline items={items} presentLabel="現在" />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 空の場合の説明テキストが表示されていることを確認
		await canvas.findByText("アイテムがありません");
	},
};
