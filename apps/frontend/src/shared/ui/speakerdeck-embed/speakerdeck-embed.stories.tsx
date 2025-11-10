import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect } from "storybook/test";

import { SpeakerDeckEmbed } from "./speakerdeck-embed";

const meta = {
	component: SpeakerDeckEmbed,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
} satisfies Meta<typeof SpeakerDeckEmbed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	name: "基本的なSpeaker Deck埋め込み",
	args: {
		url: "https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition",
	},
};

export const WithSlide: Story = {
	name: "特定スライドから開始",
	args: {
		url: "https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition",
		slide: 3,
	},
};

export const IframeAttributes: Story = {
	name: "iframe属性の検証",
	args: {
		url: "https://speakerdeck.com/twada/quality-and-speed-2022-spring-edition",
		slide: 5,
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const iframe = canvasElement.querySelector("iframe");
		await expect(iframe).toBeInTheDocument();
		await expect(iframe).toHaveAttribute("src");
		await expect(iframe).toHaveAttribute("title", "Speaker Deck presentation");
		await expect(iframe).toHaveAttribute("allowFullScreen");
	},
};
