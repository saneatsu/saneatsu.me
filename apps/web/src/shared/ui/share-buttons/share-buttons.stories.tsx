import type { Meta, StoryObj } from "@storybook/nextjs";

import { ShareButtons } from "./share-buttons";

const meta: Meta<typeof ShareButtons> = {
	component: ShareButtons,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	argTypes: {
		url: {
			control: "text",
			description: "シェアするURL",
		},
		title: {
			control: "text",
			description: "シェアするタイトル",
		},
		className: {
			control: "text",
			description: "追加のCSSクラス",
		},
	},
} satisfies Meta<typeof ShareButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示
 *
 * 通常の記事シェアボタンの表示を確認できる。
 */
export const Default: Story = {
	name: "デフォルト表示",
	tags: ["code-only"],
	args: {
		url: "https://saneatsu.me/blog/example-article",
		title: "サンプル記事のタイトル",
	},
};

/**
 * 長いタイトル
 *
 * タイトルが長い場合でもURLエンコードが正しく機能することを確認。
 */
export const LongTitle: Story = {
	name: "長いタイトル",
	tags: ["code-only"],
	args: {
		url: "https://saneatsu.me/blog/very-long-article-slug-example",
		title:
			"これは非常に長い記事タイトルの例です。日本語、記号、数字123、特殊文字&@#などを含んでいます。",
	},
};

/**
 * カスタムクラス適用
 *
 * className propで追加のスタイリングが適用できることを確認。
 */
export const CustomClass: Story = {
	name: "カスタムクラス適用",
	tags: ["code-only"],
	args: {
		url: "https://saneatsu.me/blog/example",
		title: "記事タイトル",
		className: "justify-center",
	},
};

/**
 * ダークモード表示
 *
 * ダークモードでのボタンの表示を確認。
 */
export const DarkMode: Story = {
	name: "ダークモード表示",
	tags: ["code-only"],
	parameters: {
		backgrounds: {
			default: "dark",
		},
	},
	args: {
		url: "https://saneatsu.me/blog/example",
		title: "ダークモードの記事",
	},
};

/**
 * モバイル表示
 *
 * モバイルサイズでのボタン配置を確認。
 */
export const Mobile: Story = {
	name: "モバイル表示",
	tags: ["code-only"],
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
	args: {
		url: "https://saneatsu.me/blog/mobile-article",
		title: "モバイル記事のタイトル",
	},
};
