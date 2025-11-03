import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "storybook/test";

import type { Tag } from "@/shared";

import { TagBadge } from "./tag-badge";

const meta = {
	component: TagBadge,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<div className="p-4">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof TagBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 日本語タグのベースデータ
 */
const baseTagJa: Tag = {
	id: 1,
	slug: "typescript",
	articleCount: 10,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	translations: {
		ja: "TypeScript",
		en: "TypeScript",
	},
};

/**
 * 英語タグのベースデータ
 */
const baseTagEn: Tag = {
	id: 2,
	slug: "react",
	articleCount: 15,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	translations: {
		ja: "React",
		en: "React",
	},
};

export const Default: Story = {
	name: "デフォルト表示（日本語）",
	args: {
		tag: baseTagJa,
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タグ名が表示されていることを確認
		const tagName = canvas.getByText("TypeScript");
		expect(tagName).toBeInTheDocument();
	},
};

export const EnglishTag: Story = {
	name: "英語タグ",
	args: {
		tag: baseTagEn,
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タグ名が表示されていることを確認
		const tagName = canvas.getByText("React");
		expect(tagName).toBeInTheDocument();
	},
};

export const NoTranslation: Story = {
	name: "翻訳なし（スラッグをフォールバック）",
	tags: ["validation"],
	args: {
		tag: {
			...baseTagJa,
			translations: {
				ja: null,
				en: null,
			},
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// スラッグが表示されていることを確認
		const slugText = canvas.getByText("typescript");
		expect(slugText).toBeInTheDocument();
	},
};

export const LongTagName: Story = {
	name: "長いタグ名",
	tags: ["code-only"],
	args: {
		tag: {
			...baseTagJa,
			translations: {
				ja: "これは非常に長いタグ名のテストです",
				en: "This is a very long tag name test",
			},
		},
	},
};

export const MultipleTagsDemo: Story = {
	name: "複数タグの表示デモ",
	tags: ["code-only"],
	args: {
		tag: baseTagJa,
	},
	render: () => (
		<div className="flex gap-2 flex-wrap">
			<TagBadge tag={baseTagJa} />
			<TagBadge tag={baseTagEn} />
			<TagBadge
				tag={{
					id: 3,
					slug: "nextjs",
					articleCount: 20,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					translations: {
						ja: "Next.js",
						en: "Next.js",
					},
				}}
			/>
		</div>
	),
};
