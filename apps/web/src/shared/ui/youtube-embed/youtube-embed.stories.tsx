import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect } from "storybook/test";

import { YouTubeEmbed } from "./youtube-embed";

const meta = {
	component: YouTubeEmbed,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
} satisfies Meta<typeof YouTubeEmbed>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 基本的なYouTube埋め込み
 */
export const Default: Story = {
	name: "基本的なYouTube埋め込み",
	tags: ["code-only"],
	args: {
		videoId: "dQw4w9WgXcQ",
	},
};

/**
 * タイムスタンプ付きYouTube埋め込み（10秒から開始）
 */
export const WithTimestamp: Story = {
	name: "タイムスタンプ付き（10秒から開始）",
	tags: ["code-only"],
	args: {
		videoId: "dQw4w9WgXcQ",
		startTime: 10,
	},
};

/**
 * ショートURL形式のビデオID
 */
export const ShortUrl: Story = {
	name: "ショートURL形式のビデオID",
	tags: ["code-only"],
	args: {
		videoId: "jNQXAC9IVRw",
	},
};

/**
 * iframe要素の検証
 */
export const IframeValidation: Story = {
	name: "iframe要素の検証",
	args: {
		videoId: "dQw4w9WgXcQ",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// iframe要素が存在することを確認
		const iframe = canvasElement.querySelector("iframe");
		await expect(iframe).toBeInTheDocument();

		// src属性にyoutube-nocookie.comが含まれることを確認（プライバシー強化モード）
		await expect(iframe).toHaveAttribute(
			"src",
			expect.stringContaining("youtube-nocookie.com")
		);

		// src属性にビデオIDが含まれることを確認
		await expect(iframe).toHaveAttribute(
			"src",
			expect.stringContaining("dQw4w9WgXcQ")
		);

		// allowFullScreen属性が存在することを確認
		await expect(iframe).toHaveAttribute("allowFullScreen");

		// title属性が存在することを確認（アクセシビリティ）
		await expect(iframe).toHaveAttribute("title", "YouTube video player");
	},
};

/**
 * タイムスタンプパラメータの検証
 */
export const TimestampParameterValidation: Story = {
	name: "タイムスタンプパラメータの検証",
	args: {
		videoId: "dQw4w9WgXcQ",
		startTime: 123,
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// iframe要素が存在することを確認
		const iframe = canvasElement.querySelector("iframe");
		await expect(iframe).toBeInTheDocument();

		// src属性にstart=123が含まれることを確認
		await expect(iframe).toHaveAttribute(
			"src",
			expect.stringContaining("start=123")
		);
	},
};

/**
 * プレーヤー設定パラメータの検証
 */
export const PlayerParametersValidation: Story = {
	name: "プレーヤー設定パラメータの検証",
	args: {
		videoId: "dQw4w9WgXcQ",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// iframe要素が存在することを確認
		const iframe = canvasElement.querySelector("iframe");
		await expect(iframe).toBeInTheDocument();

		const src = iframe?.getAttribute("src") || "";

		// 自動再生無効（autoplay=0）
		await expect(src).toContain("autoplay=0");

		// コントロール表示（controls=1）
		await expect(src).toContain("controls=1");

		// YouTubeロゴ最小化（modestbranding=1）
		await expect(src).toContain("modestbranding=1");

		// 関連動画を同じチャンネルのみに（rel=0）
		await expect(src).toContain("rel=0");
	},
};

/**
 * レスポンシブデザインの検証
 */
export const ResponsiveDesign: Story = {
	name: "レスポンシブデザイン（モバイル）",
	args: {
		videoId: "dQw4w9WgXcQ",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// iframe要素が存在することを確認
		const iframe = canvasElement.querySelector("iframe");
		await expect(iframe).toBeInTheDocument();

		// 親コンテナが存在することを確認
		const container = iframe?.parentElement;
		await expect(container).toBeInTheDocument();

		// アスペクト比が16:9であることを確認（paddingBottom: 56.25%）
		const paddingBottom = window.getComputedStyle(
			container as HTMLElement
		).paddingBottom;
		await expect(paddingBottom).toBe("56.25%");
	},
};

/**
 * タブレット表示の検証
 */
export const TabletView: Story = {
	name: "レスポンシブデザイン（タブレット）",
	tags: ["code-only"],
	args: {
		videoId: "dQw4w9WgXcQ",
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};
