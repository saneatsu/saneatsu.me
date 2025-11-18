import type { Meta, StoryObj } from "@storybook/nextjs";
import type { ArticleOgImageContentProps } from "./og-image-view";

import { ArticleOgImageContent, SiteOgImageContent } from "./og-image-view";

const meta = {
	component: ArticleOgImageContent,
	parameters: {
		layout: "centered",
	},
	args: {
		title: "成長して何かを達成するうえで大切にしている3つのこと",
	},
} satisfies Meta<typeof ArticleOgImageContent>;

export default meta;

type Story = StoryObj<typeof meta>;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<div
		style={{
			width: 1200,
			height: 630,
			borderRadius: 24,
			overflow: "hidden",
			boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
		}}
	>
		{children}
	</div>
);

const renderArticle = (args: ArticleOgImageContentProps) => (
	<Wrapper>
		<ArticleOgImageContent {...args} />
	</Wrapper>
);

export const ArticleWithoutThumbnail: Story = {
	render: (args) => renderArticle(args as ArticleOgImageContentProps),
};

export const ArticleWithThumbnail: Story = {
	args: {
		backgroundImage: null,
	},
	render: (args) => renderArticle(args as ArticleOgImageContentProps),
};

export const ArticleLongTitle: Story = {
	args: {
		title:
			"信頼を積み上げていくための20のアイデアと、一度壊れた信頼を取り戻すときに意識しているチェックリスト",
	},
	render: (args) => renderArticle(args as ArticleOgImageContentProps),
};

export const SiteDefault: Story = {
	render: () => (
		<Wrapper>
			<SiteOgImageContent />
		</Wrapper>
	),
};
