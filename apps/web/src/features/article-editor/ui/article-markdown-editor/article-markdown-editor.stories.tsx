import type { Meta, StoryObj } from "@storybook/nextjs";

import { ArticleMarkdownEditor } from "./article-markdown-editor";

const meta: Meta<typeof ArticleMarkdownEditor> = {
	component: ArticleMarkdownEditor,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
// biome-ignore lint/correctness/noUnusedVariables: Will be used when stories are implemented
type Story = StoryObj<typeof meta>;

// TODO: Storybookのテストを後で実装
