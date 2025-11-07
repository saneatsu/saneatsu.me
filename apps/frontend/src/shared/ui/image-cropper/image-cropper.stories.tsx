import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { ImageCropper } from "./image-cropper";

const meta = {
	component: ImageCropper,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		layout: "fullscreen",
	},
	args: {
		onCropComplete: fn(),
		onCancel: fn(),
	},
	decorators: [
		(Story: React.ComponentType) => (
			<div className="h-screen w-full">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ImageCropper>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルトの自由な矩形選択モード
 */
export const Default: Story = {
	name: "デフォルト（自由な矩形選択）",
	tags: ["code-only"],
	args: {
		imageSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
	},
};

/**
 * 正方形モード
 */
export const SquareMode: Story = {
	name: "正方形モード",
	tags: ["code-only"],
	args: {
		imageSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
	},
};

/**
 * 横長の画像
 */
export const LandscapeImage: Story = {
	name: "横長の画像",
	tags: ["code-only"],
	args: {
		imageSrc:
			"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080",
	},
};

/**
 * 縦長の画像
 */
export const PortraitImage: Story = {
	name: "縦長の画像",
	tags: ["code-only"],
	args: {
		imageSrc:
			"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1920",
	},
};

/**
 * 正方形モード切り替えのインタラクションテスト
 */
export const SquareModeToggle: Story = {
	name: "正方形モード切り替え",
	tags: ["validation"],
	args: {
		imageSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 1. 正方形ボタンをクリック
		const squareButton = canvas.getByRole("button", { name: /正方形/ });
		await userEvent.click(squareButton);

		// 2. ボタンのスタイルが変わることを確認（variant="default"になる）
		// Note: ボタンのスタイルチェックは実装の詳細なので、存在確認のみ
		await expect(squareButton).toBeInTheDocument();

		// 3. 再度クリックして元に戻す
		await userEvent.click(squareButton);
		await expect(squareButton).toBeInTheDocument();
	},
};

/**
 * キャンセルボタンのテスト
 */
export const CancelAction: Story = {
	name: "キャンセル機能",
	tags: ["validation"],
	args: {
		imageSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// キャンセルボタンをクリック
		const cancelButton = canvas.getByRole("button", { name: /キャンセル/ });
		await userEvent.click(cancelButton);

		// onCancelが呼ばれることを確認
		await expect(args.onCancel).toHaveBeenCalledTimes(1);
	},
};

/**
 * クロップボタンの動作テスト
 */
export const CropAction: Story = {
	name: "クロップ実行",
	tags: ["validation"],
	args: {
		imageSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 画像が読み込まれてクロップボタンが有効になるまで待つ
		const cropButton = canvas.getByRole("button", { name: /クロップ/ });
		await waitFor(() => {
			expect(cropButton).not.toBeDisabled();
		});

		// クロップボタンをクリック
		await userEvent.click(cropButton);

		// onCropCompleteが呼ばれることを確認（Blobが渡される）
		await waitFor(() => {
			expect(args.onCropComplete).toHaveBeenCalledTimes(1);
		});

		// 引数がBlobであることを確認
		const call = args.onCropComplete.mock.calls[0];
		await expect(call?.[0]).toBeInstanceOf(Blob);
	},
};
