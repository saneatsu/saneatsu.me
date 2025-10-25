import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { Button } from "../button/button";
import { Lightbox } from "./lightbox";

const meta: Meta<typeof Lightbox> = {
	component: Lightbox,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 閉じた状態（open: false）
 */
export const Closed: Story = {
	name: "閉じた状態",
	tags: ["code-only"],
	args: {
		imageUrl: "https://picsum.photos/1600/900",
		alt: "サンプル画像",
		open: false,
		onClose: () => {},
	},
};

/**
 * 開いた状態（open: true）- 横長画像
 */
export const OpenLandscape: Story = {
	name: "開いた状態（横長画像 1600x900）",
	tags: ["code-only"],
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Lightboxを開く</Button>
				<Lightbox
					imageUrl="https://picsum.photos/1600/900"
					alt="横長画像"
					open={open}
					onClose={() => setOpen(false)}
				/>
			</>
		);
	},
};

/**
 * 縦長画像
 */
export const Portrait: Story = {
	name: "縦長画像（900x1600）",
	tags: ["code-only"],
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Lightboxを開く</Button>
				<Lightbox
					imageUrl="https://picsum.photos/900/1600"
					alt="縦長画像"
					open={open}
					onClose={() => setOpen(false)}
				/>
			</>
		);
	},
};

/**
 * 正方形画像
 */
export const Square: Story = {
	name: "正方形画像（1200x1200）",
	tags: ["code-only"],
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Lightboxを開く</Button>
				<Lightbox
					imageUrl="https://picsum.photos/1200/1200"
					alt="正方形画像"
					open={open}
					onClose={() => setOpen(false)}
				/>
			</>
		);
	},
};
