import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "storybook/test";

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

/**
 * リンクコピー機能
 *
 * リンクコピーボタンの動作を確認できる。
 * コピーボタンをクリックすると、アイコンがCheckに変化し、成功トーストが表示される。
 */
export const CopyLinkFeature: Story = {
	name: "リンクコピー機能",
	tags: ["code-only"],
	args: {
		url: "https://saneatsu.me/blog/copy-test-article",
		title: "コピー機能テスト記事",
	},
};

/**
 * Xシェアリンクのハッシュタグ検証
 *
 * Xシェアボタンのリンクにハッシュタグパラメータ（hashtags=saneatsu_me）が
 * 正しく含まれていることを検証する。
 */
export const HashtagValidation: Story = {
	name: "Xシェアリンクのハッシュタグ検証",
	args: {
		url: "https://saneatsu.me/blog/hashtag-test",
		title: "ハッシュタグテスト記事",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// XシェアボタンのリンクをARIAラベルで取得
		const xShareButton = canvas.getByLabelText("Share on X");

		// href属性を取得
		const href = xShareButton.getAttribute("href");

		// href が null でないことを確認
		expect(href).not.toBeNull();

		// ハッシュタグパラメータが含まれていることを確認
		expect(href).toContain("hashtags=saneatsu_me");

		// URL全体の構造が正しいことを確認
		expect(href).toContain("https://twitter.com/intent/tweet");
		expect(href).toContain(
			`text=${encodeURIComponent("ハッシュタグテスト記事")}`
		);
		expect(href).toContain(
			`url=${encodeURIComponent("https://saneatsu.me/blog/hashtag-test")}`
		);
		expect(href).toContain("via=saneatsu_wakana");
	},
};
