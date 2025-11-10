import type { Meta, StoryObj } from "@storybook/nextjs";
import { HttpResponse, http } from "msw";
import { expect, waitFor } from "storybook/test";

import { SpeakerDeckEmbed } from "./speakerdeck-embed";

const speakerDeckHandler = http.get(
	"/api/speakerdeck/oembed",
	({ request }) => {
		const url = new URL(request.url);
		const slide = url.searchParams.get("slide");
		return HttpResponse.json({
			html: `<iframe src="//speakerdeck.com/player/mock" title="Speaker Deck presentation" allowfullscreen></iframe>`,
			width: 710,
			height: 399,
			slide,
		});
	}
);

const meta = {
	component: SpeakerDeckEmbed,
	parameters: {
		msw: {
			handlers: [speakerDeckHandler],
		},
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
		await waitFor(() => {
			const iframe = canvasElement.querySelector("iframe");
			expect(iframe).toBeInTheDocument();
		});
		const iframe = canvasElement.querySelector("iframe");
		await expect(iframe).toHaveAttribute("src");
		await expect(iframe).toHaveAttribute("title", "Speaker Deck presentation");
		await expect(iframe).toHaveAttribute("allowFullScreen");
	},
};
