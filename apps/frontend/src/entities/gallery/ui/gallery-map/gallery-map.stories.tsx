import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, within } from "storybook/test";

import type { GalleryImage } from "../../model/types";
import { GalleryMap } from "./gallery-map";

const meta: Meta<typeof GalleryMap> = {
	component: GalleryMap,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * テスト用のギャラリー画像データ
 */
const mockImages: GalleryImage[] = [
	{
		id: 1,
		cfImageId: "test-image-1",
		latitude: 35.6812,
		longitude: 139.7671,
		takenAt: "2024-01-01T00:00:00Z",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
		translations: [
			{
				id: 1,
				galleryImageId: 1,
				language: "ja",
				title: "東京駅",
				description: "東京駅の写真",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		],
	},
	{
		id: 2,
		cfImageId: "test-image-2",
		latitude: 35.6586,
		longitude: 139.7454,
		takenAt: "2024-01-02T00:00:00Z",
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
		translations: [
			{
				id: 2,
				galleryImageId: 2,
				language: "ja",
				title: "東京タワー",
				description: "東京タワーの写真",
				createdAt: "2024-01-02T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			},
		],
	},
	{
		id: 3,
		cfImageId: "test-image-3",
		latitude: 35.7101,
		longitude: 139.8107,
		takenAt: "2024-01-03T00:00:00Z",
		createdAt: "2024-01-03T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
		translations: [
			{
				id: 3,
				galleryImageId: 3,
				language: "ja",
				title: "スカイツリー",
				description: "スカイツリーの写真",
				createdAt: "2024-01-03T00:00:00Z",
				updatedAt: "2024-01-03T00:00:00Z",
			},
		],
	},
];

const mockImagesWithoutLocation: GalleryImage[] = [
	{
		id: 4,
		cfImageId: "test-image-4",
		latitude: null,
		longitude: null,
		takenAt: "2024-01-04T00:00:00Z",
		createdAt: "2024-01-04T00:00:00Z",
		updatedAt: "2024-01-04T00:00:00Z",
		translations: [
			{
				id: 4,
				galleryImageId: 4,
				language: "ja",
				title: "位置情報なし",
				description: "位置情報のない画像",
				createdAt: "2024-01-04T00:00:00Z",
				updatedAt: "2024-01-04T00:00:00Z",
			},
		],
	},
];

/**
 * 複数の画像がある場合、全てのマーカーが見えるように地図が表示される
 */
export const WithMultipleImages: Story = {
	name: "複数画像の表示",
	tags: ["code-only"],
	args: {
		images: mockImages,
		height: "500px",
	},
};

/**
 * 1つの画像のみの場合、その位置にズームして表示される
 */
export const WithSingleImage: Story = {
	name: "単一画像の表示",
	tags: ["code-only"],
	args: {
		images: [mockImages[0]],
		height: "500px",
	},
};

/**
 * 位置情報がない画像のみの場合、空の状態を表示する
 */
export const WithNoLocationData: Story = {
	name: "位置情報なしの画像の表示",
	tags: ["validation"],
	args: {
		images: mockImagesWithoutLocation,
		height: "500px",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 空の状態メッセージが表示されることを確認
		const emptyMessage = canvas.getByText("位置情報を持つ画像がありません");
		expect(emptyMessage).toBeInTheDocument();
	},
};

/**
 * マーカークリックのコールバック付きで表示
 *
 * @description
 * Mapboxは非同期で読み込まれるため、マーカークリックのテストはStorybookではなく
 * ユニットテストで行うべき。ここでは視覚的確認のみ。
 */
export const WithMarkerClickCallback: Story = {
	name: "マーカークリック時のコールバック設定",
	tags: ["code-only"],
	args: {
		images: [mockImages[0]],
		height: "500px",
		onImageClick: fn(),
	},
};

/**
 * カスタム高さで表示
 */
export const WithCustomHeight: Story = {
	name: "カスタム高さの適用",
	tags: ["code-only"],
	args: {
		images: mockImages,
		height: "300px",
	},
};

/**
 * 位置情報ありとなしが混在する場合、位置情報ありのみが表示される
 */
export const WithMixedLocationData: Story = {
	name: "位置情報あり・なし混在時の表示",
	tags: ["code-only"],
	args: {
		images: [...mockImages, ...mockImagesWithoutLocation],
		height: "500px",
	},
};
