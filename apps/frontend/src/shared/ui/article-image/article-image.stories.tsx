import type { Meta, StoryObj } from "@storybook/nextjs";

import { ArticleImage } from "./article-image";

const meta: Meta<typeof ArticleImage> = {
	component: ArticleImage,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 横長画像（1600x900）
 */
export const Landscape: Story = {
	name: "横長画像（1600x900）",
	tags: ["code-only"],
	args: {
		src: "https://picsum.photos/1600/900",
		alt: "横長画像のサンプル",
	},
};

/**
 * 縦長画像（900x1600）
 */
export const Portrait: Story = {
	name: "縦長画像（900x1600）",
	tags: ["code-only"],
	args: {
		src: "https://picsum.photos/900/1600",
		alt: "縦長画像のサンプル",
	},
};

/**
 * 正方形画像（1200x1200）
 */
export const Square: Story = {
	name: "正方形画像（1200x1200）",
	tags: ["code-only"],
	args: {
		src: "https://picsum.photos/1200/1200",
		alt: "正方形画像のサンプル",
	},
};

/**
 * クリックでLightbox表示のインタラクション
 */
export const WithInteraction: Story = {
	name: "クリックでLightbox表示",
	tags: ["code-only"],
	render: () => {
		return (
			<div>
				<p className="mb-4 text-sm text-muted-foreground">
					画像をクリックすると、Lightboxで拡大表示されます
				</p>
				<ArticleImage
					src="https://picsum.photos/1600/900"
					alt="クリック可能な画像"
				/>
			</div>
		);
	},
};

/**
 * カスタムクラス名を適用
 */
export const WithCustomClassName: Story = {
	name: "カスタムクラス名適用",
	tags: ["code-only"],
	args: {
		src: "https://picsum.photos/800/600",
		alt: "カスタムクラス付き画像",
		className: "rounded-lg shadow-lg",
	},
};

/**
 * alt属性なしのケース
 */
export const WithoutAlt: Story = {
	name: "alt属性なし",
	tags: ["code-only"],
	args: {
		src: "https://picsum.photos/800/600",
	},
};
